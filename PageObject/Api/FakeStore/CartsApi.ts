import type { ApiResponse } from '../../../Utilities/Http/ApiResponse';
import { CrudApi } from '../CrudApi';

export class CartsApi extends CrudApi {
  protected readonly resourcePath = '/carts';

  listByUser(userId: string): Promise<ApiResponse> {
    return this.http.send({ method: 'GET', path: this.pathFor('user', userId) });
  }
}
