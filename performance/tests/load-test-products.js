import http from 'k6/http';
import { check, sleep } from 'k6';
import { LOAD_THINK_TIME_SECONDS, loadThresholds } from '../config/thresholds.js';
import {
  abortIfUnreachable,
  buildSummary,
  FAKESTORE_BASE_URL,
  parseJson,
} from '../utils/helpers.js';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: loadThresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  abortIfUnreachable(`${FAKESTORE_BASE_URL}/products`);
}

export default function () {
  const response = http.get(`${FAKESTORE_BASE_URL}/products`);

  check(response, {
    'status 200': (r) => r.status === 200,
    'lista no vacía': (r) => {
      const body = parseJson(r);
      return Array.isArray(body) && body.length > 0;
    },
    'respuesta en menos de 500 ms': (r) => r.timings.duration < 500,
  });

  sleep(LOAD_THINK_TIME_SECONDS);
}

export const handleSummary = buildSummary('load-test-products');
