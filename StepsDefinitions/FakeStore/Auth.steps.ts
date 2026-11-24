import { When } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('inicio sesión con el body:', async function (this: ApiWorld, body: string) {
  this.response = await (await this.fakeStore()).auth.login(this.resolve(body));
});
