import assert from 'node:assert/strict';
import { findSchemaErrors } from './SchemaValidator';

export function assertEquals(subject: string, actual: unknown, expected: unknown): void {
  assert.deepEqual(
    actual,
    expected,
    `${subject}: esperado ${show(expected)}, recibido ${show(actual)}`,
  );
}

export function assertTrue(condition: boolean, message: string): asserts condition {
  assert.ok(condition, message);
}

export function assertMatchesSchema(schemaName: string, data: unknown): void {
  const errors = findSchemaErrors(schemaName, data);
  assert.equal(
    errors.length,
    0,
    `El body no cumple el contrato "${schemaName}": ${errors.join('; ')}. Recibido: ${show(data)}`,
  );
}

export function asArray(data: unknown): unknown[] {
  assertTrue(Array.isArray(data), `Se esperaba un array, recibido ${show(data)}`);
  return data;
}

export function asObject(data: unknown): Record<string, unknown> {
  assertTrue(
    typeof data === 'object' && data !== null && !Array.isArray(data),
    `Se esperaba un objeto, recibido ${show(data)}`,
  );
  return data as Record<string, unknown>;
}

function show(value: unknown): string {
  return (JSON.stringify(value) ?? 'undefined').slice(0, 300);
}
