/**
 * Onda 42 — Chaos experiments estendidos.
 * Cenários adicionais além de loadtests/chaos.js:
 *   - Slowloris: conexões lentas segurando sockets
 *   - Payload gigante: 5MB body para stressar limites
 *   - Auth flood: tentativas de login inválidas para exercitar lockout
 *   - Tracking pixel storm: 2000 RPS sustentado por 1min
 *   - SQL injection probes: payloads maliciosos em query params
 *   - Header abuse: headers gigantes / repetidos
 *
 * Executa APENAS em staging. Nunca em produção.
 *
 * Uso:
 *   STAGING_URL=https://staging.fuxico.dev k6 run loadtests/chaos-extended.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const injectionBlocked = new Rate("injection_blocked");
const authFlood429 = new Rate("auth_flood_429");
const oversizedRejected = new Rate("oversized_rejected");
const trackingSurvival = new Rate("tracking_survival");
const headerAbuseRejected = new Counter("header_abuse_rejected");

export const options = {
  scenarios: {
    slowloris: {
      executor: "constant-vus",
      vus: 50,
      duration: "3m",
      exec: "slowloris",
    },
    oversized_payload: {
      executor: "constant-arrival-rate",
      rate: 2,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 4,
      exec: "oversized",
    },
    auth_flood: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      stages: [
        { target: 50, duration: "1m" },
        { target: 100, duration: "1m" },
        { target: 0, duration: "30s" },
      ],
      preAllocatedVUs: 30,
      exec: "authFlood",
    },
    tracking_storm: {
      executor: "constant-arrival-rate",
      rate: 2000,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 300,
      maxVUs: 500,
      exec: "trackingStorm",
      startTime: "3m",
    },
    sql_injection_probes: {
      executor: "constant-arrival-rate",
      rate: 10,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 10,
      exec: "sqlInjection",
    },
    header_abuse: {
      executor: "constant-arrival-rate",
      rate: 3,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 5,
      exec: "headerAbuse",
    },
  },
  thresholds: {
    injection_blocked: ["rate>0.95"],
    auth_flood_429: ["rate>0.5"],
    oversized_rejected: ["rate>0.9"],
    tracking_survival: ["rate>0.98"],
  },
};

const BASE = __ENV.STAGING_URL || "https://staging.fuxico.dev";

export function slowloris() {
  // Simula cliente lento: request com timeout curto e sleep entre partes
  const r = http.get(`${BASE}/`, { timeout: "60s" });
  check(r, { "served or refused": (r) => r.status !== 0 });
  sleep(30); // segura VU por 30s
}

export function oversized() {
  const bigPayload = "x".repeat(5 * 1024 * 1024); // 5MB
  const r = http.post(
    `${BASE}/functions/v1/track-event`,
    JSON.stringify({ data: bigPayload }),
    { headers: { "Content-Type": "application/json" }, timeout: "10s" },
  );
  oversizedRejected.add(r.status === 413 || r.status === 400 || r.status === 0);
}

export function authFlood() {
  const email = `chaos-${Math.floor(Math.random() * 1000)}@evil.com`;
  const r = http.post(
    `${BASE}/functions/v1/auth-login`,
    JSON.stringify({ email, password: "wrong-password" }),
    { headers: { "Content-Type": "application/json" } },
  );
  authFlood429.add(r.status === 429 || r.status === 423);
}

export function trackingStorm() {
  const tid = `storm-${__VU}-${__ITER}`;
  const r = http.get(`${BASE}/functions/v1/track-pixel?tid=${tid}`, {
    timeout: "5s",
  });
  trackingSurvival.add(r.status === 200);
}

export function sqlInjection() {
  const payloads = [
    "'; DROP TABLE tracked_emails;--",
    "1' OR '1'='1",
    "1; SELECT pg_sleep(10);--",
    "<script>alert(1)</script>",
    "../../../etc/passwd",
    "{{7*7}}",
  ];
  const p = encodeURIComponent(payloads[Math.floor(Math.random() * payloads.length)]);
  const r = http.get(`${BASE}/functions/v1/track-link?tid=${p}&url=https%3A%2F%2Fx.com`, {
    redirects: 0,
  });
  // esperado: 400 (validation), 302 (safe redirect ignorando payload) — nunca 500
  injectionBlocked.add(r.status !== 500 && r.status !== 200);
}

export function headerAbuse() {
  const huge = "A".repeat(16 * 1024);
  const r = http.get(`${BASE}/`, {
    headers: {
      "X-Chaos-Header-1": huge,
      "X-Chaos-Header-2": huge,
      "User-Agent": huge,
    },
    timeout: "10s",
  });
  if (r.status === 431 || r.status === 400 || r.status === 413) {
    headerAbuseRejected.add(1);
  }
  check(r, { "no 5xx from header abuse": (r) => r.status < 500 });
}

export default function () {
  http.get(`${BASE}/`);
  sleep(1);
}

export function handleSummary(data) {
  const critical = [
    "injection_blocked",
    "auth_flood_429",
    "oversized_rejected",
    "tracking_survival",
  ];
  const summary = { thresholds: {}, metrics: {} };
  for (const k of critical) {
    if (data.metrics[k]) summary.metrics[k] = data.metrics[k].values;
  }
  return { stdout: JSON.stringify(summary, null, 2) };
}
