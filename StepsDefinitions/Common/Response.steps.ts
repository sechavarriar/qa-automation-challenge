import { Then } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';
import {
  asNonEmptyArray,
  asObject,
  asArray,
  assertContains,
  assertEquals,
  assertHasErrorMessage,
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
    asNonEmptyArray(this.response.json()).forEach((item) => assertMatchesSchema(schema, item));
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
    assertTrue(
      ids.length > 1 && ids.every(Number.isInteger),
      `Para comprobar el orden se esperaban al menos 2 ids enteros, recibido [${ids.join(', ')}]`,
    );
    const sorted = ids.toSorted((a, b) => (order === 'asc' ? a - b : b - a));
    assertEquals(`Ids en orden ${order}`, ids, sorted);
  },
);

Then(
  'cada elemento de la lista tiene {string} con valor {string}',
  function (this: ApiWorld, field: string, expected: string) {
    for (const item of asNonEmptyArray(this.response.json())) {
      assertEquals(`Campo ${field}`, String(asObject(item)[field]), expected);
    }
  },
);

Then(
  'cada elemento de la lista tiene {string} entre {string} y {string}',
  function (this: ApiWorld, field: string, from: string, to: string) {
    for (const item of asNonEmptyArray(this.response.json())) {
      const received = String(asObject(item)[field]);
      const day = received.slice(0, 'AAAA-MM-DD'.length);
      assertTrue(
        day >= from && day <= to,
        `Campo ${field}: se esperaba entre ${from} y ${to}, recibido ${received}`,
      );
    }
  },
);

Then('el id recibido es {int}', function (this: ApiWorld, expected: number) {
  assertEquals('Id', asObject(this.response.json()).id, expected);
});

Then('guardo el id recibido', function (this: ApiWorld) {
  const { id } = asObject(this.response.json());
  assertTrue(
    typeof id === 'number' && Number.isInteger(id) && id > 0,
    `Se esperaba un id entero mayor que 0, recibido ${String(id)}`,
  );
  this.savedId = id;
});

Then('el id recibido es el guardado', function (this: ApiWorld) {
  assertEquals('Id', asObject(this.response.json()).id, this.requireSavedId());
});

Then(
  'el campo {string} tiene el valor {string}',
  function (this: ApiWorld, field: string, expected: string) {
    assertEquals(`Campo ${field}`, asObject(this.response.json())[field], this.resolve(expected));
  },
);

Then('guardo la cantidad de elementos de la lista', function (this: ApiWorld) {
  this.savedCount = asNonEmptyArray(this.response.json()).length;
});

Then('la lista tiene menos elementos que la cantidad guardada', function (this: ApiWorld) {
  assertTrue(this.savedCount !== undefined, 'No hay una cantidad guardada con la cual comparar');
  const received = asArray(this.response.json()).length;
  assertTrue(
    received < this.savedCount,
    `Cantidad de elementos: se esperaban menos de ${this.savedCount}, recibidos ${received}`,
  );
});

Then('lo recibido coincide con lo enviado', function (this: ApiWorld) {
  assertTrue(this.sentBody !== undefined, 'No hay un body enviado con el cual comparar');
  assertContains(asObject(this.response.json()), asObject(JSON.parse(this.sentBody)));
});

Then('la respuesta incluye un mensaje de error', function (this: ApiWorld) {
  assertHasErrorMessage(this.response.rawBody);
});
