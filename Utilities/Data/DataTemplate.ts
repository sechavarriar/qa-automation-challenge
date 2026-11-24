import { randomUUID } from 'node:crypto';

/** Reemplaza `{unico}` por un valor irrepetible; es el mismo en todo el texto recibido. */
export function resolveTemplate(text: string): string {
  if (!text.includes('{unico}')) return text;
  const unique = `${Date.now()}${randomUUID().slice(0, 8)}`;
  return text.replaceAll('{unico}', unique);
}

/** Convierte "limit=5&sort=desc" en parámetros de consulta. */
export function parseQuery(text: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(text));
}
