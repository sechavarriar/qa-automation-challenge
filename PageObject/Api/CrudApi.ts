import type { ApiResponse } from '../../Utilities/Http/ApiResponse';
import type { HttpClient } from '../../Utilities/Http/HttpClient';
import type { QueryParams } from '../../Utilities/Http/HttpTypes';

export type UpdateMethod = 'PUT' | 'PATCH';

/** Operaciones comunes a cualquier recurso REST. Cada API Object concreto define su ruta. */
export abstract class CrudApi {
  protected abstract readonly resourcePath: string;

  constructor(protected readonly http: HttpClient) {}

  list(query?: QueryParams): Promise<ApiResponse> {
    return this.http.send({ method: 'GET', path: this.resourcePath, query });
  }

  getById(id: string): Promise<ApiResponse> {
    return this.http.send({ method: 'GET', path: this.pathFor(id) });
  }

  create(rawBody: string): Promise<ApiResponse> {
    return this.http.send({ method: 'POST', path: this.resourcePath, rawBody });
  }

  update(method: UpdateMethod, id: string, rawBody: string): Promise<ApiResponse> {
    return this.http.send({ method, path: this.pathFor(id), rawBody });
  }

  remove(id: string): Promise<ApiResponse> {
    return this.http.send({ method: 'DELETE', path: this.pathFor(id) });
  }

  protected pathFor(...segments: string[]): string {
    return [this.resourcePath, ...segments.map(encodeURIComponent)].join('/');
  }
}
