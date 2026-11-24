import { When } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('consulto las categorías de productos', async function (this: ApiWorld) {
  this.response = await (await this.fakeStore()).products.listCategories();
});

When(
  'consulto los productos de la categoría {string}',
  async function (this: ApiWorld, category: string) {
    this.response = await (await this.fakeStore()).products.listByCategory(category);
  },
);
