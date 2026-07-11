/**
 * Chaos experiments com k6 — injeta falhas para validar resiliência.
 * Executa APENAS em staging.
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    normal_traffic: { executor: "constant-vus", vus: 20, duration: "5m" },
    // Chaos: 10% de requests recebem payload malformado
    malformed_payload: {
      executor: "constant-arrival-rate",
      rate: 5, timeUnit: "1s", duration: "5m",
      preAllocatedVUs: 5, exec: "malformed",
    },
    // Chaos: burst de 1000 RPS por 30s para simular DDoS
    ddos_burst: {
      executor: "ramping-arrival-rate",
      startRate: 100, timeUnit: "1s",
      stages: [{ target: 1000, duration: "30s" }, { target: 0, duration: "10s" }],
      preAllocatedVUs: 200, exec: "burst", startTime: "2m",
    },
  },
  thresholds: {
    "http_req_failed{scenario:normal_traffic}": ["rate<0.01"], // < 1% erro no baseline
    "http_req_duration{scenario:normal_traffic}": ["p(95)<500"],
  },
};

const BASE = __ENV.STAGING_URL || "https://staging.fuxico.dev";

export function malformed() {
  const r = http.post(`${BASE}/functions/v1/track-event`,
    "not-json-{{{",
    { headers: { "Content-Type": "application/json" } });
  check(r, { "rejected 4xx": (r) => r.status >= 400 && r.status < 500 });
}

export function burst() {
  http.get(`${BASE}/functions/v1/track-pixel?tid=chaos-${__VU}-${__ITER}`);
  sleep(0.01);
}

export default function () {
  http.get(`${BASE}/`);
  sleep(1);
}
