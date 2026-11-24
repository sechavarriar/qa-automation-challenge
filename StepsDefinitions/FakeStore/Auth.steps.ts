import { When } from '@cucumber/cucumber';
import { resolveTemplate } from '../../Utilities/Data/DataTemplate';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('inicio sesión con el body:', async function (this: ApiWorld, body: string) {
  this.response = await (await this.fakeStore()).auth.login(resolveTemplate(body));
});
