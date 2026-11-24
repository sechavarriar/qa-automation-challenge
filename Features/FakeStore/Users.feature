@fakestore @users @regression
Feature: FakeStoreAPI - Users
  Como administrador de la tienda
  Quiero consultar y administrar usuarios
  Para mantener sus datos al día

  @smoke
  Scenario Outline: [<caso>] Listar usuarios (fuente: <fuente>)
    When consulto el listado de users
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"

    Examples:
      | caso   | status | content_type     | contrato | fuente    |
      | USR-01 | 200    | application/json | user     | ENUNCIADO |

  Scenario Outline: [<caso>] Limitar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de users con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And la lista tiene <cantidad> elementos

    Examples:
      | caso   | parametros | status | content_type     | contrato | cantidad | fuente   |
      | USR-02 | limit=1    | 200    | application/json | user     | 1        | CONTRATO |
      | USR-03 | limit=5    | 200    | application/json | user     | 5        | CONTRATO |

  Scenario Outline: [<caso>] Ordenar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de users con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And los ids de la lista están en orden "<orden>"

    Examples:
      | caso   | parametros | status | content_type     | contrato | orden | fuente   |
      | USR-04 | sort=asc   | 200    | application/json | user     | asc   | CONTRATO |
      | USR-05 | sort=desc  | 200    | application/json | user     | desc  | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Consultar el usuario <id> (fuente: <fuente>)
    When consulto en users el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | fuente    |
      | USR-06 | 1  | 200    | application/json | user     | ENUNCIADO |
      | USR-07 | 5  | 200    | application/json | user     | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Consultar un usuario con id <descripcion> (fuente: <fuente>)
    When consulto en users el id "<id>"
    Then el status es <status>

    @defecto-FS-01
    Examples: id inexistente
      | caso   | descripcion | id   | status | fuente |
      | USR-08 | inexistente | 9999 | 404    | HTTP   |

    Examples:
      | caso   | descripcion | id  | status | fuente   |
      | USR-09 | no numérico | abc | 400    | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Crear el usuario "<username>" (fuente: <fuente>)
    When creo en users un registro con el body:
      """
      {
        "email": "<email>",
        "username": "<username>",
        "password": "<password>",
        "name": { "firstname": "<firstname>", "lastname": "<lastname>" },
        "address": {
          "city": "<city>",
          "street": "<street>",
          "number": <number>,
          "zipcode": "<zipcode>",
          "geolocation": { "lat": "<lat>", "long": "<long>" }
        },
        "phone": "<phone>"
      }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And lo recibido coincide con lo enviado

    @defecto-FS-07
    Examples: la creación no devuelve lo enviado
      | caso   | email                  | username   | password     | firstname | lastname | city   | street   | number | zipcode | lat    | long     | phone          | status | content_type     | contrato | fuente    |
      | USR-10 | qa.{unico}@example.com | qa.{unico} | Clave-demo-1 | Ana       | Prueba   | Bogotá | Calle 10 | 25     | 110111  | 4.6097 | -74.0817 | 1-570-236-7033 | 201    | application/json | user     | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Crear un usuario con body inválido: <descripcion> (fuente: <fuente>)
    When creo en users un registro con el body:
      """
      <body>
      """
    Then el status es <status>
    And la respuesta incluye un mensaje de error

    @defecto-FS-03
    Examples: body que incumple el contrato
      | caso   | descripcion    | body                                                                                                                                                                                                                                                                             | status | fuente    |
      | USR-11 | sin campos     | {}                                                                                                                                                                                                                                                                               | 400    | ENUNCIADO |
      | USR-12 | email numérico | {"email":12345,"username":"qa","password":"Clave-demo-1","name":{"firstname":"Ana","lastname":"Prueba"},"address":{"city":"Bogotá","street":"Calle 10","number":25,"zipcode":"110111","geolocation":{"lat":"4.6097","long":"-74.0817"}},"phone":"1-570-236-7033"}                | 400    | CONTRATO  |
      | USR-13 | email sin @    | {"email":"correo.example.com","username":"qa","password":"Clave-demo-1","name":{"firstname":"Ana","lastname":"Prueba"},"address":{"city":"Bogotá","street":"Calle 10","number":25,"zipcode":"110111","geolocation":{"lat":"4.6097","long":"-74.0817"}},"phone":"1-570-236-7033"} | 400    | ENUNCIADO |

    Examples:
      | caso   | descripcion      | body      | status | fuente    |
      | USR-14 | JSON mal formado | {"email": | 400    | ENUNCIADO |

  Scenario Outline: [<caso>] Actualizar con <metodo> el usuario <id> (fuente: <fuente>)
    When actualizo con <metodo> en users el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    And lo recibido coincide con lo enviado

    @defecto-FS-08
    Examples: la actualización no devuelve el id
      | caso   | metodo | id | body                                                                                                                                                                                                                                                                                         | status | content_type     | contrato          | fuente    |
      | USR-15 | PUT    | 7  | {"email":"qa.{unico}@example.com","username":"qa.{unico}","password":"Clave-demo-1","name":{"firstname":"Ana","lastname":"Prueba"},"address":{"city":"Bogotá","street":"Calle 10","number":25,"zipcode":"110111","geolocation":{"lat":"4.6097","long":"-74.0817"}},"phone":"1-570-236-7033"} | 200    | application/json | user              | ENUNCIADO |
      | USR-16 | PATCH  | 8  | {"email":"qa.{unico}@example.com"}                                                                                                                                                                                                                                                           | 200    | application/json | identified-record | SUPUESTO  |

  @negativo
  Scenario Outline: [<caso>] Actualizar con <metodo> un usuario con id <descripcion> (fuente: <fuente>)
    When actualizo con <metodo> en users el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>

    @defecto-FS-04
    Examples: id inexistente
      | caso   | metodo | descripcion | id   | body                                                                                                                                                                                                                                                                                 | status | fuente |
      | USR-17 | PUT    | inexistente | 9999 | {"email":"qa.{unico}@example.com","username":"qa","password":"Clave-demo-1","name":{"firstname":"Ana","lastname":"Prueba"},"address":{"city":"Bogotá","street":"Calle 10","number":25,"zipcode":"110111","geolocation":{"lat":"4.6097","long":"-74.0817"}},"phone":"1-570-236-7033"} | 404    | HTTP   |
      | USR-18 | PATCH  | inexistente | 9999 | {"username":"qa"}                                                                                                                                                                                                                                                                    | 404    | HTTP   |

    Examples:
      | caso   | metodo | descripcion | id  | body                                                                                                                                                                                                                                                                                 | status | fuente   |
      | USR-19 | PUT    | no numérico | abc | {"email":"qa.{unico}@example.com","username":"qa","password":"Clave-demo-1","name":{"firstname":"Ana","lastname":"Prueba"},"address":{"city":"Bogotá","street":"Calle 10","number":25,"zipcode":"110111","geolocation":{"lat":"4.6097","long":"-74.0817"}},"phone":"1-570-236-7033"} | 400    | CONTRATO |

  Scenario Outline: [<caso>] Eliminar el usuario <id> y consultarlo de nuevo (fuente: <fuente>)
    # La documentación oficial indica que nada se borra de la base de datos.
    When elimino en users el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    When consulto en users el id "<id>"
    Then el status es <status_consulta>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | status_consulta | fuente   |
      | USR-20 | 6  | 200    | application/json | user     | 200             | SUPUESTO |

  @negativo
  Scenario Outline: [<caso>] Eliminar un usuario con id <descripcion> (fuente: <fuente>)
    When elimino en users el id "<id>"
    Then el status es <status>

    @defecto-FS-05
    Examples: id inexistente
      | caso   | descripcion | id   | status | fuente |
      | USR-21 | inexistente | 9999 | 404    | HTTP   |

    Examples:
      | caso   | descripcion | id  | status | fuente   |
      | USR-22 | no numérico | abc | 400    | CONTRATO |
