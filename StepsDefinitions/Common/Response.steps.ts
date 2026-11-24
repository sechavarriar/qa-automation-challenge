import { Then } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';
import {
  asArray,
  asObject,
  assertEquals,
  assertMatchesSchema,
  assertTrue,
} from '../../Utilities/Validation/Assertions';

Then('el status es {int}', function (this: ApiWorld, expected: number) {
  assertEquals('Status', this.response.status, expected);
});

Then(
  'el header {string} contiene {string}',
  function (this: ApiWorld, name: string, expected: string) {
    const received = this.response.header(name) ?? '';
    assertTrue(
      received.toLowerCase().includes(expected.toLowerCase()),
      `Header ${name}: se esperaba que contuviera "${expected}", recibido "${received}"`,
    );
  },
);

Then('el body cumple el contrato {string}', function (this: ApiWorld, schema: string) {
  assertMatchesSchema(schema, this.response.json());
});

Then(
  'el body es una lista no vacía donde cada elemento cumple el contrato {string}',
  function (this: ApiWorld, schema: string) {
    const items = asArray(this.response.json());
    assertTrue(items.length > 0, 'Se esperaba al menos 1 elemento, recibida una lista vacía');
    items.forEach((item) => assertMatchesSchema(schema, item));
  },
);

Then('la lista tiene {int} elementos', function (this: ApiWorld, expected: number) {
  assertEquals('Cantidad de elementos', asArray(this.response.json()).length, expected);
});

Then(
  'los ids de la lista están en orden {string}',
  function (this: ApiWorld, order: string) {
    assertTrue(['asc', 'desc'].includes(order), `Orden no soportado: "${order}"`);
    const ids = asArray(this.response.json()).map((item) => Number(asObject(item).id));
    const sorted = ids.toSorted((a, b) => (order === 'asc' ? a - b : b - a));
    assertEquals(`Ids en orden ${order}`, ids, sorted);
  },
);

Then(
  'cada elemento de la lista tiene {string} con valor {string}',
  function (this: ApiWorld, field: string, expected: string) {
    for (const item of asArray(this.response.json())) {
      assertEquals(`Campo ${field}`, String(asObject(item)[field]), expected);
    }
  },
);

Then('el id recibido es {int}', function (this: ApiWorld, expected: number) {
  assertEquals('Id', asObject(this.response.json()).id, expected);
});

Then('lo recibido coincide con lo enviado', function (this: ApiWorld) {
  assertTrue(this.sentBody !== undefined, 'No hay un body enviado con el cual comparar');
  const sent = asObject(JSON.parse(this.sentBody));
  const received = asObject(this.response.json());
  for (const [field, value] of Object.entries(sent)) {
    assertEquals(`Campo ${field}`, received[field], value);
  }
});

Then('la respuesta incluye un mensaje de error', function (this: ApiWorld) {
  assertTrue(
    this.response.rawBody.trim() !== '',
    'Se esperaba un mensaje de error, recibido un body vacío',
  );
});
