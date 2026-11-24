import { When } from '@cucumber/cucumber';
import type { UpdateMethod } from '../../PageObject/Api/CrudApi';
import type { FakeStoreResource } from '../../PageObject/Api/FakeStore/FakeStoreApi';
import { parseQuery, resolveTemplate } from '../../Utilities/Data/DataTemplate';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('consulto el listado de {recurso}', async function (this: ApiWorld, resource: FakeStoreResource) {
  this.response = await (await this.fakeStore()).resource(resource).list();
});

When(
  'consulto el listado de {recurso} con los parámetros {string}',
  async function (this: ApiWorld, resource: FakeStoreResource, query: string) {
    this.response = await (await this.fakeStore()).resource(resource).list(parseQuery(query));
  },
);

When(
  'consulto en {recurso} el id {string}',
  async function (this: ApiWorld, resource: FakeStoreResource, id: string) {
    this.response = await (await this.fakeStore()).resource(resource).getById(id);
  },
);

When(
  'creo en {recurso} un registro con el body:',
  async function (this: ApiWorld, resource: FakeStoreResource, body: string) {
    this.sentBody = resolveTemplate(body);
    this.response = await (await this.fakeStore()).resource(resource).create(this.sentBody);
  },
);

When(
  'actualizo con {metodoActualizacion} en {recurso} el id {string} con el body:',
  async function (
    this: ApiWorld,
    method: UpdateMethod,
    resource: FakeStoreResource,
    id: string,
    body: string,
  ) {
    this.sentBody = resolveTemplate(body);
    this.response = await (await this.fakeStore()).resource(resource).update(method, id, this.sentBody);
  },
);

When(
  'elimino en {recurso} el id {string}',
  async function (this: ApiWorld, resource: FakeStoreResource, id: string) {
    this.response = await (await this.fakeStore()).resource(resource).remove(id);
  },
);
