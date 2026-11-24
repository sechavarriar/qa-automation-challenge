import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { STRESS_THINK_TIME_SECONDS, stressThresholds } from '../config/thresholds.js';
import {
  buildSummary,
  currentPhase,
  GOREST_BASE_URL,
  parseJson,
  requiredEnv,
  uniqueUser,
} from '../utils/helpers.js';

const created = new Counter('users_created');
const rateLimited = new Rate('rate_limited');
const serverErrors = new Rate('server_errors');
const createdDuration = new Trend('created_duration', true);

const PHASES = [
  { name: '1', until: 60 },
  { name: '2', until: 120 },
  { name: '3', until: 180 },
];

// GoRest limita las peticiones por token y sus términos piden no saturarlo. El think time
// mantiene los 200 VUs del enunciado y hace que el límite se cruce solo en la última fase.
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
      ],
      gracefulStop: '10s',
    },
  },
  thresholds: stressThresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const params = {
  headers: {
    Authorization: `Bearer ${requiredEnv('GOREST_TOKEN')}`,
    'Content-Type': 'application/json',
  },
};

export default function () {
  const response = http.post(`${GOREST_BASE_URL}/public/v2/users`, JSON.stringify(uniqueUser()), {
    ...params,
    tags: { fase: currentPhase(PHASES) },
  });

  const isCreated = response.status === 201;
  created.add(isCreated ? 1 : 0);
  rateLimited.add(response.status === 429);
  serverErrors.add(response.status >= 500 || response.status === 0);
  if (isCreated) createdDuration.add(response.timings.duration);

  check(response, {
    'creado (201)': (r) => r.status === 201,
    'rechazo controlado: 429 con mensaje': (r) =>
      r.status !== 429 || Boolean((parseJson(r) || {}).message),
  });

  sleep(STRESS_THINK_TIME_SECONDS);
}

export const handleSummary = buildSummary('stress-test-users');
