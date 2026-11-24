import type { HttpClient } from '../../../Utilities/Http/HttpClient';
import type { CrudApi } from '../CrudApi';
import { AuthApi } from './AuthApi';
import { CartsApi } from './CartsApi';
import { ProductsApi } from './ProductsApi';
import { UsersApi } from './UsersApi';

/** Nombres de recurso que se pueden usar desde los features. */
export const FAKE_STORE_RESOURCES = ['products', 'carts', 'users'] as const;
export type FakeStoreResource = (typeof FAKE_STORE_RESOURCES)[number];

export class FakeStoreApi {
  readonly products: ProductsApi;
  readonly carts: CartsApi;
  readonly users: UsersApi;
  readonly auth: AuthApi;

  constructor(http: HttpClient) {
    this.products = new ProductsApi(http);
    this.carts = new CartsApi(http);
    this.users = new UsersApi(http);
    this.auth = new AuthApi(http);
  }

  resource(name: FakeStoreResource): CrudApi {
    return this[name];
  }
}
