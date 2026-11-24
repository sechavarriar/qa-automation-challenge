import type { HttpClient } from '../../../Utilities/Http/HttpClient';
import type { CrudApi } from '../CrudApi';
import { ProductsApi } from './ProductsApi';

/** Nombres de recurso que se pueden usar desde los features. */
export const FAKE_STORE_RESOURCES = ['products'] as const;
export type FakeStoreResource = (typeof FAKE_STORE_RESOURCES)[number];

export class FakeStoreApi {
  readonly products: ProductsApi;

  constructor(http: HttpClient) {
    this.products = new ProductsApi(http);
  }

  resource(name: FakeStoreResource): CrudApi {
    return this[name];
  }
}
