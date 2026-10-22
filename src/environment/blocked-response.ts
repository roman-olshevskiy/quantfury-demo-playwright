// Recognizes responses produced by the CDN / bot protection in front of the demo instead of by the
// application. Such a response means "this runner may not use the demo" — an environment
// condition, never a product defect (requirements §21). It is detected, not bypassed.

const BLOCKING_STATUSES = new Set([403, 429, 503]);
const CLOUDFLARE_BODY =
  /cf-error-details|Attention Required! \| Cloudflare|cdn-cgi\/challenge-platform|Just a moment\.\.\./i;

export interface BlockedResponseInput {
  status: number;
  headers: Readonly<Record<string, string>>;
  /** Body text when available; only the first few KB are inspected. */
  body?: string;
}

/** A short description such as `Cloudflare block page (HTTP 403, cf-ray 8f…-FRA)`, or undefined. */
export function describeBlockedResponse(input: BlockedResponseInput): string | undefined {
  const { status, headers } = input;
  const body = input.body?.slice(0, 8_000) ?? '';
  const fromCloudflare = (headers.server ?? '').toLowerCase().includes('cloudflare');
  const mitigated = headers['cf-mitigated'];
  const looksLikeCloudflarePage = CLOUDFLARE_BODY.test(body);

  if (
    mitigated === undefined &&
    !(BLOCKING_STATUSES.has(status) && (fromCloudflare || looksLikeCloudflarePage))
  ) {
    return undefined;
  }
  const kind =
    mitigated === 'challenge' || /challenge-platform|Just a moment/i.test(body)
      ? 'Cloudflare challenge'
      : 'Cloudflare block page';
  const details = [`HTTP ${String(status)}`];
  if (headers['cf-ray'] !== undefined) details.push(`cf-ray ${headers['cf-ray']}`);
  const title = /<title>([^<]{1,120})<\/title>/i.exec(body)?.[1]?.trim();
  if (title !== undefined && title !== '') details.push(`title "${title}"`);
  return `${kind} (${details.join(', ')})`;
}
