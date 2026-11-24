import { defineParameterType } from '@cucumber/cucumber';
import type { UpdateMethod } from '../../PageObject/Api/CrudApi';
import {
  FAKE_STORE_RESOURCES,
  type FakeStoreResource,
} from '../../PageObject/Api/FakeStore/FakeStoreApi';

defineParameterType({
  name: 'recurso',
  regexp: new RegExp(FAKE_STORE_RESOURCES.join('|')),
  transformer: (name) => name as FakeStoreResource,
});

defineParameterType({
  name: 'metodoActualizacion',
  regexp: /PUT|PATCH/,
  transformer: (method) => method as UpdateMethod,
});
