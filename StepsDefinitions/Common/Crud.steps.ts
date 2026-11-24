import { When } from '@cucumber/cucumber';
import type { UpdateMethod } from '../../PageObject/Api/CrudApi';
import type { ResourceName } from '../../PageObject/Api/ResourceCatalog';
import { parseQuery } from '../../Utilities/Data/DataTemplate';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';

When('consulto el listado de {recurso}', async function (this: ApiWorld, resource: ResourceName) {
  this.response = await (await this.api(resource)).list();
});

When(
  'consulto el listado de {recurso} con los parámetros {string}',
  async function (this: ApiWorld, resource: ResourceName, query: string) {
    this.response = await (await this.api(resource)).list(parseQuery(query));
  },
);

When(
  'consulto en {recurso} el id {string}',
  async function (this: ApiWorld, resource: ResourceName, id: string) {
    this.response = await (await this.api(resource)).getById(this.resolve(id));
  },
);

When(
  'creo en {recurso} un registro con el body:',
  async function (this: ApiWorld, resource: ResourceName, body: string) {
    this.sentBody = this.resolve(body);
    this.response = await (await this.api(resource)).create(this.sentBody);
    this.trackCreated(resource);
  },
);

When(
  'actualizo con {metodoActualizacion} en {recurso} el id {string} con el body:',
  async function (
    this: ApiWorld,
    method: UpdateMethod,
    resource: ResourceName,
    id: string,
    body: string,
  ) {
    this.sentBody = this.resolve(body);
    this.response = await (await this.api(resource)).update(method, this.resolve(id), this.sentBody);
  },
);

When(
  'elimino en {recurso} el id {string}',
  async function (this: ApiWorld, resource: ResourceName, id: string) {
    this.response = await (await this.api(resource)).remove(this.resolve(id));
  },
);
