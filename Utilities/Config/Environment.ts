import { config as loadEnvFile } from 'dotenv';

// `.env.<ambiente>` tiene prioridad sobre `.env`; las variables del sistema, sobre ambos.
loadEnvFile({ path: [`.env.${process.env.TEST_ENV?.trim() || 'qa'}`, '.env'], quiet: true });

const ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod'] as const;
type EnvironmentName = (typeof ENVIRONMENTS)[number];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} debe ser un entero positivo. Valor recibido: "${raw}".`);
  }
  return value;
}

function environmentName(): EnvironmentName {
  const raw = process.env.TEST_ENV?.trim() || 'qa';
  const match = ENVIRONMENTS.find((name) => name === raw);
  if (!match) {
    throw new Error(`TEST_ENV="${raw}" no es válido. Usa: ${ENVIRONMENTS.join(', ')}.`);
  }
  return match;
}

/** Los valores se leen al usarse: FakeStoreAPI se puede probar sin token de GoRest. */
export const Environment = {
  /** Falla al arrancar si el ambiente indicado no existe. */
  validate(): void {
    environmentName();
  },
  get fakeStoreBaseUrl(): string {
    return required('FAKESTORE_BASE_URL');
  },
  get goRestBaseUrl(): string {
    return required('GOREST_BASE_URL');
  },
  get goRestToken(): string {
    return required('GOREST_TOKEN');
  },
  get requestTimeoutMs(): number {
    return positiveInteger('REQUEST_TIMEOUT_MS', 15_000);
  },
};
