export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string>;

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  /** Texto tal cual se envía. Permite mandar JSON mal formado en casos negativos. */
  rawBody?: string;
}

export interface HttpExchange {
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  durationMs: number;
  attempt: number;
  error?: string;
}

export type ExchangeListener = (exchange: HttpExchange) => void | Promise<void>;
