import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 },  // stay at 20 users
    { duration: '10s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
  },
};

const BASE_URL = 'https://npjfwzzapbtcguoupozd.supabase.co/functions/v1';

export default function () {
  const res = http.get(`${BASE_URL}/health-check`);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
