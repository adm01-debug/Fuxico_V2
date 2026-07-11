/**
 * k6 Load / Stress Test — Endpoints de tracking de alta cardinalidade.
 *
 * Cenários cobertos:
 *   - smoke:     sanidade (1 VU, 30s)  — usado em PRs
 *   - load:      carga sustentada (50 VUs, 2min) — regressões de p95
 *   - stress:    ramp até 200 VUs (5min) — encontra o joelho de saturação
 *
 * SLOs (alinhados com mem://roadmap/slo-definition):
 *   - p95 latência /track-open  < 100ms
 *   - p95 latência /track-click < 150ms  (inclui redirect)
 *   - taxa de erro global      < 0.5%
 *
 * Execução local:
 *   BASE_URL=https://blopallcxuotfutblkoe.supabase.co k6 run tests/load/track-endpoints.k6.js
 *
 * Execução em CI (perfil smoke — leve, seguro):
 *   K6_SCENARIO=smoke k6 run tests/load/track-endpoints.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const errorRate = new Rate('tracking_errors');
const openLatency = new Trend('track_open_latency', true);
const clickLatency = new Trend('track_click_latency', true);

const BASE_URL = __ENV.BASE_URL || 'https://blopallcxuotfutblkoe.supabase.co';
const SCENARIO = __ENV.K6_SCENARIO || 'smoke';

const scenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
    tags: { scenario: 'smoke' },
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 25 },
      { duration: '1m30s', target: 50 },
      { duration: '30s', target: 0 },
    ],
    tags: { scenario: 'load' },
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '1m', target: 200 },
      { duration: '1m', target: 0 },
    ],
    tags: { scenario: 'stress' },
  },
};

export const options = {
  scenarios: { [SCENARIO]: scenarios[SCENARIO] },
  thresholds: {
    tracking_errors: ['rate<0.005'],
    track_open_latency: ['p(95)<100'],
    track_click_latency: ['p(95)<150'],
    http_req_failed: ['rate<0.01'],
  },
  // Não seguir redirects — queremos medir só o hop do Edge Function.
  noVUConnectionReuse: false,
};

/**
 * Gera um tracking_id sintético. Endpoints devem responder 200 (pixel 1x1)
 * mesmo para IDs desconhecidos — é o comportamento defensivo esperado
 * para não vazar existência de trackers.
 */
function makeTrackingId() {
  return `k6-${randomString(16)}-${randomIntBetween(1, 1_000_000)}`;
}

export default function () {
  const trackingId = makeTrackingId();

  // 1) /track-open — pixel GIF 1x1
  const openRes = http.get(`${BASE_URL}/functions/v1/track-open/${trackingId}.gif`, {
    tags: { endpoint: 'track_open' },
    headers: { 'User-Agent': 'k6-load-test/1.0' },
    redirects: 0,
  });
  openLatency.add(openRes.timings.duration);
  const openOk = check(openRes, {
    'track-open: status 200': (r) => r.status === 200,
    'track-open: retornou imagem': (r) =>
      (r.headers['Content-Type'] || '').includes('image'),
  });
  if (!openOk) errorRate.add(1); else errorRate.add(0);

  sleep(randomIntBetween(1, 3) / 10); // 0.1-0.3s entre requests

  // 2) /track-click — deve responder 302/301 com redirect
  const clickRes = http.get(
    `${BASE_URL}/functions/v1/track-click/${trackingId}?url=${encodeURIComponent('https://example.com')}`,
    {
      tags: { endpoint: 'track_click' },
      headers: { 'User-Agent': 'k6-load-test/1.0' },
      redirects: 0,
    },
  );
  clickLatency.add(clickRes.timings.duration);
  const clickOk = check(clickRes, {
    'track-click: redirect 3xx': (r) => r.status >= 300 && r.status < 400,
    'track-click: header Location': (r) => !!r.headers['Location'],
  });
  if (!clickOk) errorRate.add(1); else errorRate.add(0);

  sleep(randomIntBetween(1, 5) / 10);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        scenario: SCENARIO,
        base_url: BASE_URL,
        p95_open_ms: data.metrics.track_open_latency?.values['p(95)'],
        p95_click_ms: data.metrics.track_click_latency?.values['p(95)'],
        error_rate: data.metrics.tracking_errors?.values.rate,
        http_reqs: data.metrics.http_reqs?.values.count,
      },
      null,
      2,
    ),
    'tests/load/last-run-summary.json': JSON.stringify(data, null, 2),
  };
}
