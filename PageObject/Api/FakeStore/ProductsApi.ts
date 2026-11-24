import type { ApiResponse } from '../../../Utilities/Http/ApiResponse';
import { CrudApi } from '../CrudApi';

export class ProductsApi extends CrudApi {
  protected readonly resourcePath = '/products';

  listCategories(): Promise<ApiResponse> {
    return this.http.send({ method: 'GET', path: this.pathFor('categories') });
  }

  listByCategory(category: string): Promise<ApiResponse> {
    return this.http.send({ method: 'GET', path: this.pathFor('category', category) });
  }
}
