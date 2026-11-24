import { defineParameterType } from '@cucumber/cucumber';
import type { UpdateMethod } from '../../PageObject/Api/CrudApi';
import { RESOURCES, type ResourceName } from '../../PageObject/Api/ResourceCatalog';

defineParameterType({
  name: 'recurso',
  regexp: new RegExp(RESOURCES.join('|')),
  transformer: (name) => name as ResourceName,
});

defineParameterType({
  name: 'metodoActualizacion',
  regexp: /PUT|PATCH/,
  transformer: (method) => method as UpdateMethod,
});
