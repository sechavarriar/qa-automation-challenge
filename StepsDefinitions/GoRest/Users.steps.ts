import { Given, Then } from '@cucumber/cucumber';
import type { ApiWorld } from '../../Utilities/Support/ApiWorld';
import { asNonEmptyArray, asObject, assertTrue } from '../../Utilities/Validation/Assertions';

Given('que uso en GoRest el token {string}', function (this: ApiWorld, token: string) {
  this.useGoRestToken(token);
});

Then(
  'el body incluye un error en el campo {string}',
  function (this: ApiWorld, field: string) {
    findFieldError(this, field);
  },
);

Then(
  'el body incluye un error en el campo {string} con el mensaje {string}',
  function (this: ApiWorld, field: string, expected: string) {
    const message = findFieldError(this, field).message;
    assertTrue(
      message === expected,
      `Mensaje del campo ${field}: esperado "${expected}", recibido "${String(message)}"`,
    );
  },
);

function findFieldError(world: ApiWorld, field: string): Record<string, unknown> {
  const errors = asNonEmptyArray(world.response.json()).map(asObject);
  const found = errors.find((error) => error.field === field);
  assertTrue(
    found !== undefined,
    `Se esperaba un error en "${field}", recibidos: ${errors.map((error) => String(error.field)).join(', ')}`,
  );
  return found;
}
