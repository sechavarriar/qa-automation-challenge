import { setWorldConstructor, World } from '@cucumber/cucumber';
import { FakeStoreApi } from '../../PageObject/Api/FakeStore/FakeStoreApi';
import { Environment } from '../Config/Environment';
import type { ApiResponse } from '../Http/ApiResponse';
import { HttpClient } from '../Http/HttpClient';
import type { HttpExchange } from '../Http/HttpTypes';
import { formatExchange } from '../Logging/ExchangeFormatter';

/** Estado de un escenario. Cucumber crea uno nuevo por escenario: no se comparte nada. */
export class ApiWorld extends World {
  private readonly clients: HttpClient[] = [];
  private fakeStoreApi?: FakeStoreApi;
  private lastResponse?: ApiResponse;

  /** Cuerpo enviado en la última creación o actualización. */
  sentBody?: string;

  async fakeStore(): Promise<FakeStoreApi> {
    this.fakeStoreApi ??= new FakeStoreApi(await this.openClient(Environment.fakeStoreBaseUrl));
    return this.fakeStoreApi;
  }

  get response(): ApiResponse {
    if (!this.lastResponse) throw new Error('Todavía no se ha hecho ninguna petición.');
    return this.lastResponse;
  }

  set response(value: ApiResponse) {
    this.lastResponse = value;
  }

  async closeClients(): Promise<void> {
    await Promise.all(this.clients.map((client) => client.dispose()));
  }

  private async openClient(baseUrl: string, headers?: Record<string, string>): Promise<HttpClient> {
    const client = await HttpClient.create({
      baseUrl,
      headers,
      timeoutMs: Environment.requestTimeoutMs,
      onExchange: (exchange) => this.logExchange(exchange),
    });
    this.clients.push(client);
    return client;
  }

  /** Se adjunta como texto plano: el reporte HTML no interpreta el tipo que usa `log()`. */
  private logExchange(exchange: HttpExchange): void {
    this.attach(formatExchange(exchange), 'text/plain');
  }
}

setWorldConstructor(ApiWorld);
