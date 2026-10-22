// Redaction for anything that ends up in reports: attachments, logs and error messages.
// Demo device ids are session identifiers (docs/product-discovery.md §9) and are masked too.

const SENSITIVE_NAME =
  /token|auth|session|password|secret|cookie|api-?key|deviceid|registrationkey|appsflyerid/i;

export const REDACTED = '<redacted>';

export function isSensitiveName(name: string): boolean {
  return SENSITIVE_NAME.test(name);
}

export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength
    ? `${text.slice(0, maxLength)}… (${String(text.length)} chars total)`
    : text;
}

export function redactHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      isSensitiveName(name) ? REDACTED : value,
    ]),
  );
}

export function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveName(key) ? REDACTED : redactJson(item),
      ]),
    );
  }
  return value;
}

export function redactUrl(url: string): string {
  const parsed = new URL(url);
  for (const name of [...parsed.searchParams.keys()]) {
    if (isSensitiveName(name)) parsed.searchParams.set(name, REDACTED);
  }
  return parsed.toString();
}
