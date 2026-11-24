import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

const SCHEMAS_FOLDER = join(__dirname, '..', 'Schemas');

const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);

const compiled = new Map<string, ValidateFunction>();

/** Devuelve los incumplimientos del contrato; lista vacía si el dato lo cumple. */
export function findSchemaErrors(schemaName: string, data: unknown): string[] {
  const validate = loadSchema(schemaName);
  if (validate(data)) return [];
  return (validate.errors ?? []).map(({ instancePath, message }) =>
    `${instancePath || 'body'} ${message ?? 'no cumple el contrato'}`,
  );
}

function loadSchema(schemaName: string): ValidateFunction {
  const existing = compiled.get(schemaName);
  if (existing) return existing;

  const file = join(SCHEMAS_FOLDER, `${schemaName}.schema.json`);
  const validate = ajv.compile(JSON.parse(readFileSync(file, 'utf8')));
  compiled.set(schemaName, validate);
  return validate;
}
