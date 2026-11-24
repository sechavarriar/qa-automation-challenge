import type { ApiResponse } from '../../../Utilities/Http/ApiResponse';
import type { HttpClient } from '../../../Utilities/Http/HttpClient';

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  login(rawBody: string): Promise<ApiResponse> {
    return this.http.send({ method: 'POST', path: '/auth/login', rawBody });
  }
}
