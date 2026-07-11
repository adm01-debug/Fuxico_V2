// =============================================================================
// FUXICO - k6 load test script
// Objetivo: 500 RPS sustentado, P95 < 200ms nos endpoints críticos.
//
// Uso local:
//   BASE_URL=https://<project-ref>.supabase.co k6 run loadtests/performance.js
// =============================================================================

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const trackPixelLatency = new Trend("track_pixel_latency", true);
const trackLinkLatency = new Trend("track_link_latency", true);

const BASE_URL = __ENV.BASE_URL || "http://localhost:54321";
const TRACKING_ID = __ENV.TRACKING_ID || "load-test-tracking-id";

export const options = {
  scenarios: {
    // Rampa gradual até 500 RPS
    ramp_up: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { target: 50, duration: "30s" },
        { target: 200, duration: "1m" },
        { target: 500, duration: "2m" },
        { target: 500, duration: "3m" }, // sustentado
        { target: 0, duration: "30s" },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"],
    errors: ["rate<0.01"],
    track_pixel_latency: ["p(95)<150"],
    track_link_latency: ["p(95)<200"],
  },
};

export default function () {
  group("track-pixel", () => {
    const res = http.get(
      `${BASE_URL}/functions/v1/track-pixel?tid=${TRACKING_ID}`,
      { tags: { endpoint: "track_pixel" } },
    );
    trackPixelLatency.add(res.timings.duration);
    const ok = check(res, {
      "pixel 200": (r) => r.status === 200,
      "pixel content-type gif": (r) =>
        (r.headers["Content-Type"] || "").includes("image"),
    });
    errorRate.add(!ok);
  });

  group("track-link", () => {
    const res = http.get(
      `${BASE_URL}/functions/v1/track-link?tid=${TRACKING_ID}&url=https%3A%2F%2Fexample.com`,
      { redirects: 0, tags: { endpoint: "track_link" } },
    );
    trackLinkLatency.add(res.timings.duration);
    const ok = check(res, {
      "link 302": (r) => r.status === 302 || r.status === 301,
    });
    errorRate.add(!ok);
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data.metrics, null, 2),
  };
}
