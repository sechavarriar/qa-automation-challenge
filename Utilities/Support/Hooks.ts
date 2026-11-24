import { After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Environment } from '../Config/Environment';
import { MAX_GET_ATTEMPTS } from '../Http/HttpClient';
import type { ApiWorld } from './ApiWorld';

// Cubre todos los intentos de un GET más un margen para sus esperas.
setDefaultTimeout(Environment.requestTimeoutMs * MAX_GET_ATTEMPTS + 5_000);

BeforeAll(() => {
  Environment.validate();
});

After(async function (this: ApiWorld) {
  await this.closeClients();
});
