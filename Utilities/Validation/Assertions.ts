import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { maskText, toMaskedJson } from '../Logging/Masking';
import { findSchemaErrors } from './SchemaValidator';

export function assertEquals(subject: string, actual: unknown, expected: unknown): void {
  assertTrue(
    isDeepStrictEqual(actual, expected),
    `${subject}: esperado ${show(expected)}, recibido ${show(actual)}`,
  );
}

export function assertTrue(condition: boolean, message: string): asserts condition {
  if (!condition) assert.fail(message);
}

export function assertMatchesSchema(schemaName: string, data: unknown): void {
  const errors = findSchemaErrors(schemaName, data);
  assertTrue(
    errors.length === 0,
    `El body no cumple el contrato "${schemaName}": ${errors.join('; ')}. Recibido: ${show(data)}`,
  );
}

/** Compara solo los campos enviados: la respuesta puede traer otros. */
export function assertContains(received: Record<string, unknown>, sent: Record<string, unknown>): void {
  for (const [field, value] of Object.entries(sent)) {
    // Se compara y se muestra como objeto para que el enmascarado actúe por nombre de campo.
    assertEquals('Campo enviado', { [field]: received[field] }, { [field]: value });
  }
}

export function asArray(data: unknown): unknown[] {
  assertTrue(Array.isArray(data), `Se esperaba un array, recibido ${show(data)}`);
  return data;
}

export function asNonEmptyArray(data: unknown): unknown[] {
  const items = asArray(data);
  assertTrue(items.length > 0, 'Se esperaba al menos 1 elemento, recibida una lista vacía');
  return items;
}

/** Acepta texto, o un objeto JSON con `message` o `error`. Un body vacío o `{}` no es un mensaje. */
export function assertHasErrorMessage(rawBody: string): void {
  assertTrue(
    extractErrorMessage(rawBody).trim() !== '',
    `Se esperaba un mensaje de error, recibido ${rawBody.trim() ? maskText(rawBody).slice(0, 300) : 'un body vacío'}`,
  );
}

export function asObject(data: unknown): Record<string, unknown> {
  assertTrue(
    typeof data === 'object' && data !== null && !Array.isArray(data),
    `Se esperaba un objeto, recibido ${show(data)}`,
  );
  return data as Record<string, unknown>;
}

function extractErrorMessage(rawBody: string): string {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
  if (typeof body === 'string') return body;
  if (typeof body !== 'object' || body === null) return '';
  const { message, error } = body as Record<string, unknown>;
  return [message, error].find((text): text is string => typeof text === 'string') ?? '';
}

function show(value: unknown): string {
  return toMaskedJson(value).slice(0, 300);
}
