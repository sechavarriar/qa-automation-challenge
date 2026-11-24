const MASK = '******';
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie']);
const SENSITIVE_FIELDS = new Set(['password', 'token', 'access_token', 'access-token']);

// Cubre comillas escapadas, valores sin comillas y JSON cortado a la mitad.
const SENSITIVE_PAIR =
  /("(?:password|token|access[_-]token)"\s*:\s*)(?:"(?:\\.|[^"\\])*"?|[^\s,}\]]+)/gi;

export function maskUrl(url: string): string {
  const masked = new URL(url);
  for (const name of [...masked.searchParams.keys()]) {
    if (SENSITIVE_FIELDS.has(name.toLowerCase())) masked.searchParams.set(name, MASK);
  }
  return masked.toString();
}

export function maskHeader(name: string, value: string): string {
  if (!SENSITIVE_HEADERS.has(name.toLowerCase())) return value;
  return value.startsWith('Bearer ') ? `Bearer ${MASK}` : MASK;
}

/** Igual que JSON.stringify, pero oculta los campos sensibles. */
export function toMaskedJson(value: unknown, indent?: number): string {
  return JSON.stringify(value, maskField, indent) ?? 'undefined';
}

/** Enmascara un texto que puede no ser JSON válido. */
export function maskText(text: string, indent?: number): string {
  try {
    return toMaskedJson(JSON.parse(text), indent);
  } catch {
    return text.replace(SENSITIVE_PAIR, `$1"${MASK}"`);
  }
}

function maskField(key: string, value: unknown): unknown {
  return SENSITIVE_FIELDS.has(key.toLowerCase()) ? MASK : value;
}
