import { After, setDefaultTimeout } from '@cucumber/cucumber';
import type { ApiWorld } from './ApiWorld';

// Debe cubrir todos los intentos de un GET más sus esperas.
setDefaultTimeout(60_000);

After(async function (this: ApiWorld) {
  await this.closeClients();
});
