import { When } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('consulto los carritos del usuario {string}', async function (this: ApiWorld, userId: string) {
  this.response = await (await this.fakeStore()).carts.listByUser(userId);
});
