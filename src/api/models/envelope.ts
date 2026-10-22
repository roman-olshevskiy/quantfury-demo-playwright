/** Successful response of every `/v13/*` endpoint (docs/product-discovery.md §6). */
export interface SuccessEnvelope<TData> {
  code: 'Success';
  isSuccess: true;
  data: TData;
}

/** Business error: returned with HTTP 200 and `isSuccess: false`. */
export interface ErrorEnvelope {
  code: string;
  isSuccess: false;
  error: string;
}

/** Business error codes observed in the demo API. */
export type ObservedErrorCode =
  | 'ValidationFailed'
  | 'StringContainsNotAllowedSymbols'
  | 'TradingInstrumentDetailsNotFound'
  | 'NotSupportedApi';

/** RFC 9110 problem details: returned with HTTP 400 when request binding fails. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  errors?: Record<string, string[]>;
  extensions?: { traceId?: string };
}
