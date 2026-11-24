import { setDefaultResultOrder } from 'node:dns';
import { request, type APIRequestContext, type APIResponse } from 'playwright';
import { ApiResponse } from './ApiResponse';
import type { ExchangeListener, HttpExchange, HttpRequest } from './HttpTypes';

// Playwright intenta IPv6 primero y espera 5 s por conexión en redes que no tienen salida IPv6.
setDefaultResultOrder('ipv4first');

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  headers?: Record<string, string>;
  onExchange?: ExchangeListener;
}

type Outcome = Pick<HttpExchange, 'response' | 'error'>;

export const MAX_GET_ATTEMPTS = 3;
const BACKOFF_MS = 500;
const NETWORK_ERROR = /ECONN|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|EPIPE|ENETUNREACH|EHOSTUNREACH|socket|timeout|timed out/i;

export class HttpClient {
  private constructor(
    private readonly context: APIRequestContext,
    private readonly options: HttpClientOptions,
    private readonly headers: Record<string, string>,
  ) {}

  static async create(options: HttpClientOptions): Promise<HttpClient> {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const context = await request.newContext({
      extraHTTPHeaders: headers,
      timeout: options.timeoutMs,
    });
    return new HttpClient(context, options, headers);
  }

  /** Reintenta solo GET y solo ante errores de red o timeout, nunca por el status recibido. */
  async send(httpRequest: HttpRequest): Promise<ApiResponse> {
    const url = this.buildUrl(httpRequest);
    const maxAttempts = httpRequest.method === 'GET' ? MAX_GET_ATTEMPTS : 1;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) await wait(BACKOFF_MS * 2 ** (attempt - 2));
      const startedAt = Date.now();
      const outcome = await this.attempt(url, httpRequest);
      await this.notify(httpRequest, url, startedAt, attempt, outcome);
      if (outcome.response) {
        const { status, headers, body } = outcome.response;
        return new ApiResponse(status, headers, body);
      }
      lastError = outcome.error ?? '';
    }

    throw new Error(
      `${httpRequest.method} ${url} no obtuvo respuesta tras ${maxAttempts} intento(s): ${lastError}`,
    );
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }

  private async attempt(url: string, httpRequest: HttpRequest): Promise<Outcome> {
    try {
      const response = await this.fetch(url, httpRequest);
      return {
        response: {
          status: response.status(),
          headers: response.headers(),
          body: await response.text(),
        },
      };
    } catch (error) {
      const description = describeError(error);
      if (!NETWORK_ERROR.test(description)) throw new Error(description);
      return { error: description };
    }
  }

  private fetch(url: string, { method, rawBody }: HttpRequest): Promise<APIResponse> {
    return this.context.fetch(url, {
      method,
      // Como Buffer, Playwright lo envía sin volver a serializarlo.
      ...(rawBody === undefined ? {} : { data: Buffer.from(rawBody, 'utf8') }),
    });
  }

  private buildUrl({ path, query }: HttpRequest): string {
    const url = new URL(path, this.options.baseUrl);
    for (const [name, value] of Object.entries(query ?? {})) {
      url.searchParams.set(name, value);
    }
    return url.toString();
  }

  private async notify(
    httpRequest: HttpRequest,
    url: string,
    startedAt: number,
    attempt: number,
    outcome: Outcome,
  ): Promise<void> {
    await this.options.onExchange?.({
      request: {
        method: httpRequest.method,
        url,
        headers: this.headers,
        body: httpRequest.rawBody,
      },
      durationMs: Date.now() - startedAt,
      attempt,
      ...outcome,
    });
  }
}

/** Playwright añade al mensaje un registro de la llamada con las cabeceras, token incluido. */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0] ?? message;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
