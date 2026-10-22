import type { ErrorEnvelope, SuccessEnvelope } from '../../api/models/envelope';

export function successEnvelope<TData>(data: TData): SuccessEnvelope<TData> {
  return { code: 'Success', isSuccess: true, data };
}

/** Business error as the API sends it: HTTP 200 with `isSuccess: false`. */
export function errorEnvelope(code: string, error: string): ErrorEnvelope {
  return { code, isSuccess: false, error };
}
