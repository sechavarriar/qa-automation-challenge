import http from 'k6/http';
import { check, sleep } from 'k6';
import { SPIKE_THINK_TIME_SECONDS, spikeThresholds } from '../config/thresholds.js';
import { buildSummary, currentPhase, FAKESTORE_BASE_URL } from '../utils/helpers.js';

const PHASES = [
  { name: 'base', until: 30 },
  { name: 'spike', until: 60 },
  { name: 'recuperacion', until: 120 },
];

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '0s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '0s', target: 10 },
        { duration: '1m', target: 10 },
      ],
    },
  },
  thresholds: spikeThresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const response = http.get(`${FAKESTORE_BASE_URL}/products`, {
    tags: { fase: currentPhase(PHASES) },
  });

  check(response, { 'status 200': (r) => r.status === 200 });

  sleep(SPIKE_THINK_TIME_SECONDS);
}

export const handleSummary = buildSummary('spike-test-products');
