@gorest @regression
Feature: GoRest - Users
  Como consumidor de GoRest
  Quiero administrar usuarios
  Para mantener sus datos al día sin correos repetidos

  # Los 4 escenarios obligatorios, encadenados con el id guardado en el World.
  @smoke @e2e
  Scenario Outline: [<caso>] Flujo E2E de un usuario actualizando con <metodo> (fuente: <fuente>)
    When creo en gorest-users un registro con el body:
      """
      { "name": "<name>", "email": "<email>", "gender": "<gender>", "status": "<status>" }
      """
    Then el status es <creado>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And lo recibido coincide con lo enviado
    And guardo el id recibido

    When actualizo con <metodo> en gorest-users el id "{id}" con el body:
      """
      { "email": "<email_nuevo>" }
      """
    Then el status es <actualizado>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es el guardado
    And lo recibido coincide con lo enviado

    When consulto en gorest-users el id "{id}"
    Then el status es <consultado>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es el guardado
    And el campo "email" tiene el valor "<email_nuevo>"

    When creo en gorest-users un registro con el body:
      """
      { "name": "<name>", "email": "<email_nuevo>", "gender": "<gender>", "status": "<status>" }
      """
    Then el status es <repetido>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato_error>"
    And el body incluye un error en el campo "email" con el mensaje "<mensaje>"

    Examples:
      | caso   | metodo | name        | email                  | email_nuevo                  | gender | status   | creado | actualizado | consultado | repetido | mensaje                | content_type     | contrato    | contrato_error | fuente    |
      | GRT-01 | PATCH  | Ana Prueba  | qa.{unico}@example.com | qa.{unico}.nuevo@example.com | female | active   | 201    | 200         | 200        | 422      | has already been taken | application/json | gorest-user | field-errors   | ENUNCIADO |
      | GRT-02 | PUT    | Luis Prueba | qa.{unico}@example.com | qa.{unico}.nuevo@example.com | male   | inactive | 201    | 200         | 200        | 422      | has already been taken | application/json | gorest-user | field-errors   | ENUNCIADO |

  Scenario Outline: [<caso>] Crear un usuario <descripcion> (fuente: <fuente>)
    When creo en gorest-users un registro con el body:
      """
      { "name": "<name>", "email": "<email>", "gender": "<gender>", "status": "<estado>" }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el header "Location" contiene "<location>"
    And el body cumple el contrato "<contrato>"
    And lo recibido coincide con lo enviado

    Examples:
      | caso   | descripcion                | name                                                                                                                                                                                                     | email                  | gender | estado   | status | content_type     | location          | contrato    | fuente   |
      | GRT-03 | female y active            | Eva Prueba                                                                                                                                                                                               | qa.{unico}@example.com | female | active   | 201    | application/json | /public/v2/users/ | gorest-user | CONTRATO |
      | GRT-04 | male e inactive            | Leo Prueba                                                                                                                                                                                               | qa.{unico}@example.com | male   | inactive | 201    | application/json | /public/v2/users/ | gorest-user | CONTRATO |
      | GRT-10 | con name de 200 caracteres | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA | qa.{unico}@example.com | male   | active   | 201    | application/json | /public/v2/users/ | gorest-user | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Rechazar la creación con <descripcion> (fuente: <fuente>)
    Given que uso en GoRest el token "<token>"
    When creo en gorest-users un registro con el body:
      """
      { "name": "Ana Prueba", "email": "qa.{unico}@example.com", "gender": "female", "status": "active" }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And la respuesta incluye un mensaje de error

    Examples:
      | caso   | descripcion    | token          | status | content_type     | fuente   |
      | GRT-05 | token ausente  |                | 401    | application/json | CONTRATO |
      | GRT-06 | token inválido | token-invalido | 401    | application/json | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Crear un usuario con body inválido: <descripcion> (fuente: <fuente>)
    When creo en gorest-users un registro con el body:
      """
      <body>
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el body incluye un error en el campo "<campo>"

    Examples:
      | caso   | descripcion              | body                                                                                                                                                                                                                                                                                    | status | content_type     | contrato     | campo  | fuente   |
      | GRT-07 | sin campos               | {}                                                                                                                                                                                                                                                                                      | 422    | application/json | field-errors | email  | CONTRATO |
      | GRT-08 | email sin @              | {"name":"Ana Prueba","email":"correo.example.com","gender":"female","status":"active"}                                                                                                                                                                                                  | 422    | application/json | field-errors | email  | CONTRATO |
      | GRT-09 | gender fuera de la lista | {"name":"Ana Prueba","email":"qa.{unico}@example.com","gender":"otro","status":"active"}                                                                                                                                                                                                | 422    | application/json | field-errors | gender | CONTRATO |
      | GRT-11 | name de 201 caracteres   | {"name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","email":"qa.{unico}@example.com","gender":"male","status":"active"} | 422    | application/json | field-errors | name   | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Consultar un usuario inexistente (fuente: <fuente>)
    When consulto en gorest-users el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And la respuesta incluye un mensaje de error

    Examples:
      | caso   | id        | status | content_type     | fuente   |
      | GRT-12 | 999999999 | 404    | application/json | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Actualizar un usuario inexistente (fuente: <fuente>)
    When actualizo con <metodo> en gorest-users el id "<id>" con el body:
      """
      { "name": "Ana Prueba" }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And la respuesta incluye un mensaje de error

    Examples:
      | caso   | metodo | id        | status | content_type     | fuente   |
      | GRT-13 | PATCH  | 999999999 | 404    | application/json | CONTRATO |

  Scenario Outline: [<caso>] Eliminar un usuario y confirmar que ya no existe (fuente: <fuente>)
    When creo en gorest-users un registro con el body:
      """
      { "name": "Ana Prueba", "email": "qa.{unico}@example.com", "gender": "female", "status": "active" }
      """
    Then el status es <creado>
    And el body cumple el contrato "<contrato>"
    And guardo el id recibido
    When elimino en gorest-users el id "{id}"
    Then el status es <eliminado>
    When consulto en gorest-users el id "{id}"
    Then el status es <consultado>
    And la respuesta incluye un mensaje de error

    Examples:
      | caso   | creado | contrato    | eliminado | consultado | fuente   |
      | GRT-14 | 201    | gorest-user | 204       | 404        | CONTRATO |
