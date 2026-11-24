import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { CrudApi } from '../../PageObject/Api/CrudApi';
import { FakeStoreApi } from '../../PageObject/Api/FakeStore/FakeStoreApi';
import { GoRestUsersApi } from '../../PageObject/Api/GoRest/GoRestUsersApi';
import type { ResourceName } from '../../PageObject/Api/ResourceCatalog';
import { Environment } from '../Config/Environment';
import { createUniqueValue, resolveTemplate } from '../Data/DataTemplate';
import type { ApiResponse } from '../Http/ApiResponse';
import { HttpClient } from '../Http/HttpClient';
import type { HttpExchange } from '../Http/HttpTypes';
import { formatExchange } from '../Logging/ExchangeFormatter';

const HTTP_CREATED = 201;

/** Estado de un escenario. Cucumber crea uno nuevo por escenario: no se comparte nada. */
export class ApiWorld extends World {
  private readonly clients: HttpClient[] = [];
  private readonly unique = createUniqueValue();
  private readonly goRestUsersToDelete: string[] = [];
  private fakeStoreApi?: FakeStoreApi;
  private goRestUsersApi?: GoRestUsersApi;
  private goRestTokenTemplate = '{token}';
  private lastResponse?: ApiResponse;

  /** Cuerpo enviado en la última creación o actualización. */
  sentBody?: string;
  savedId?: number;
  savedCount?: number;

  async fakeStore(): Promise<FakeStoreApi> {
    this.fakeStoreApi ??= new FakeStoreApi(await this.openClient(Environment.fakeStoreBaseUrl));
    return this.fakeStoreApi;
  }

  async api(name: ResourceName): Promise<CrudApi> {
    return name === 'gorest-users' ? this.goRestUsers() : (await this.fakeStore()).resource(name);
  }

  /** `{token}` es el token del ambiente; un texto vacío significa no enviar `Authorization`. */
  useGoRestToken(template: string): void {
    this.goRestTokenTemplate = template;
    this.goRestUsersApi = undefined;
  }

  /** Reemplaza `{unico}`, el mismo en todo el escenario, y `{id}`, el id guardado. */
  resolve(text: string): string {
    return resolveTemplate(text, {
      unico: () => this.unique,
      id: () => String(this.requireSavedId()),
    });
  }

  requireSavedId(): number {
    if (this.savedId === undefined) throw new Error('Todavía no se ha guardado ningún id.');
    return this.savedId;
  }

  get response(): ApiResponse {
    if (!this.lastResponse) throw new Error('Todavía no se ha hecho ninguna petición.');
    return this.lastResponse;
  }

  set response(value: ApiResponse) {
    this.lastResponse = value;
  }

  /** GoRest sí guarda lo creado: se anota para borrarlo al terminar el escenario. */
  trackCreated(resource: ResourceName): void {
    if (resource !== 'gorest-users' || this.response.status !== HTTP_CREATED) return;
    const { id } = this.response.json() as { id?: unknown };
    if (id !== undefined) this.goRestUsersToDelete.push(String(id));
  }

  /** Un fallo al limpiar se reporta, pero no cambia el resultado del escenario. */
  async cleanUp(): Promise<void> {
    if (this.goRestUsersToDelete.length > 0) {
      this.useGoRestToken('{token}');
      const users = await this.goRestUsers();
      for (const id of this.goRestUsersToDelete) {
        await users.remove(id).catch((error: Error) => {
          this.attach(`No se pudo borrar el usuario ${id}: ${error.message}`, 'text/plain');
        });
      }
    }
    await Promise.all(this.clients.map((client) => client.dispose()));
  }

  private async goRestUsers(): Promise<GoRestUsersApi> {
    this.goRestUsersApi ??= new GoRestUsersApi(
      await this.openClient(Environment.goRestBaseUrl, this.goRestHeaders()),
    );
    return this.goRestUsersApi;
  }

  private goRestHeaders(): Record<string, string> {
    const token = resolveTemplate(this.goRestTokenTemplate, {
      token: () => Environment.goRestToken,
    });
    return token === '' ? {} : { Authorization: `Bearer ${token}` };
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
