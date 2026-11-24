import { randomUUID } from 'node:crypto';

export function createUniqueValue(): string {
  return `${Date.now()}${randomUUID().slice(0, 8)}`;
}

/** Reemplaza cada marcador `{nombre}` conocido por su valor. El resto del texto no se toca. */
export function resolveTemplate(text: string, values: Record<string, () => string>): string {
  return Object.entries(values).reduce(
    (resolved, [name, read]) =>
      resolved.includes(`{${name}}`) ? resolved.replaceAll(`{${name}}`, read()) : resolved,
    text,
  );
}

/** Convierte "limit=5&sort=desc" en parámetros de consulta. */
export function parseQuery(text: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(text));
}
