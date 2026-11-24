@fakestore @carts @regression
Feature: FakeStoreAPI - Carts
  Como consumidor de la tienda
  Quiero consultar y administrar carritos
  Para gestionar las compras de los usuarios

  @smoke
  Scenario Outline: [<caso>] Listar carritos (fuente: <fuente>)
    When consulto el listado de carts
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"

    Examples:
      | caso   | status | content_type     | contrato | fuente    |
      | CRT-01 | 200    | application/json | cart     | ENUNCIADO |

  Scenario Outline: [<caso>] Limitar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de carts con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And la lista tiene <cantidad> elementos

    Examples:
      | caso   | parametros | status | content_type     | contrato | cantidad | fuente   |
      | CRT-02 | limit=1    | 200    | application/json | cart     | 1        | CONTRATO |
      | CRT-03 | limit=3    | 200    | application/json | cart     | 3        | CONTRATO |

  Scenario Outline: [<caso>] Ordenar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de carts con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And los ids de la lista están en orden "<orden>"

    Examples:
      | caso   | parametros | status | content_type     | contrato | orden | fuente   |
      | CRT-04 | sort=asc   | 200    | application/json | cart     | asc   | CONTRATO |
      | CRT-05 | sort=desc  | 200    | application/json | cart     | desc  | CONTRATO |

  Scenario Outline: [<caso>] Filtrar carritos entre <desde> y <hasta> (fuente: <fuente>)
    When consulto el listado de carts
    Then el status es <status>
    And guardo la cantidad de elementos de la lista
    When consulto el listado de carts con los parámetros "startdate=<desde>&enddate=<hasta>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And cada elemento de la lista tiene "date" entre "<desde>" y "<hasta>"
    And la lista tiene menos elementos que la cantidad guardada

    Examples:
      | caso   | desde      | hasta      | status | content_type     | contrato | fuente   |
      | CRT-06 | 2020-03-01 | 2020-03-31 | 200    | application/json | cart     | CONTRATO |

  Scenario Outline: [<caso>] Listar carritos del usuario <usuario> (fuente: <fuente>)
    When consulto los carritos del usuario "<usuario>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And cada elemento de la lista tiene "userId" con valor "<usuario>"

    Examples:
      | caso   | usuario | status | content_type     | contrato | fuente   |
      | CRT-07 | 1       | 200    | application/json | cart     | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Consultar el carrito <id> (fuente: <fuente>)
    When consulto en carts el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | fuente    |
      | CRT-08 | 1  | 200    | application/json | cart     | ENUNCIADO |
      | CRT-09 | 5  | 200    | application/json | cart     | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Consultar un carrito con id <descripcion> (fuente: <fuente>)
    When consulto en carts el id "<id>"
    Then el status es <status>

    @defecto-FS-01
    Examples: id inexistente
      | caso   | descripcion | id   | status | fuente |
      | CRT-10 | inexistente | 9999 | 404    | HTTP   |

    Examples:
      | caso   | descripcion | id  | status | fuente   |
      | CRT-11 | no numérico | abc | 400    | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Crear un carrito con <descripcion> (fuente: <fuente>)
    When creo en carts un registro con el body:
      """
      <body>
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And lo recibido coincide con lo enviado

    Examples:
      | caso   | descripcion      | body                                                                                                                  | status | content_type     | contrato | fuente    |
      | CRT-12 | un producto      | {"userId":3,"date":"2026-11-24T00:00:00.000Z","products":[{"productId":1,"quantity":2}]}                              | 201    | application/json | cart     | ENUNCIADO |
      | CRT-13 | varios productos | {"userId":5,"date":"2026-11-24T00:00:00.000Z","products":[{"productId":2,"quantity":1},{"productId":7,"quantity":4}]} | 201    | application/json | cart     | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Crear un carrito con body inválido: <descripcion> (fuente: <fuente>)
    When creo en carts un registro con el body:
      """
      <body>
      """
    Then el status es <status>
    And la respuesta incluye un mensaje de error

    @defecto-FS-03
    Examples: body que incumple el contrato
      | caso   | descripcion          | body                                                                                         | status | fuente    |
      | CRT-14 | sin campos           | {}                                                                                           | 400    | ENUNCIADO |
      | CRT-15 | userId de texto      | {"userId":"abc","date":"2026-11-24T00:00:00.000Z","products":[{"productId":1,"quantity":2}]} | 400    | CONTRATO  |
      | CRT-16 | products no es array | {"userId":3,"date":"2026-11-24T00:00:00.000Z","products":"ninguno"}                          | 400    | CONTRATO  |

    Examples:
      | caso   | descripcion      | body       | status | fuente    |
      | CRT-17 | JSON mal formado | {"userId": | 400    | ENUNCIADO |

  Scenario Outline: [<caso>] Actualizar con <metodo> el carrito <id> (fuente: <fuente>)
    When actualizo con <metodo> en carts el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    And lo recibido coincide con lo enviado

    Examples:
      | caso   | metodo | id | body                                                                                     | status | content_type     | contrato          | fuente    |
      | CRT-18 | PUT    | 3  | {"userId":3,"date":"2026-11-24T00:00:00.000Z","products":[{"productId":4,"quantity":6}]} | 200    | application/json | cart              | ENUNCIADO |
      | CRT-19 | PATCH  | 4  | {"products":[{"productId":9,"quantity":1}]}                                              | 200    | application/json | identified-record | SUPUESTO  |

  @negativo
  Scenario Outline: [<caso>] Actualizar con <metodo> un carrito con id <descripcion> (fuente: <fuente>)
    When actualizo con <metodo> en carts el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>

    @defecto-FS-04
    Examples: id inexistente
      | caso   | metodo | descripcion | id   | body                                                                                     | status | fuente |
      | CRT-20 | PUT    | inexistente | 9999 | {"userId":3,"date":"2026-11-24T00:00:00.000Z","products":[{"productId":4,"quantity":6}]} | 404    | HTTP   |
      | CRT-21 | PATCH  | inexistente | 9999 | {"userId":3}                                                                             | 404    | HTTP   |

    Examples:
      | caso   | metodo | descripcion | id  | body                                                                                     | status | fuente   |
      | CRT-22 | PUT    | no numérico | abc | {"userId":3,"date":"2026-11-24T00:00:00.000Z","products":[{"productId":4,"quantity":6}]} | 400    | CONTRATO |

  Scenario Outline: [<caso>] Eliminar el carrito <id> y consultarlo de nuevo (fuente: <fuente>)
    # La documentación oficial indica que nada se borra de la base de datos.
    When elimino en carts el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    When consulto en carts el id "<id>"
    Then el status es <status_consulta>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | status_consulta | fuente   |
      | CRT-23 | 2  | 200    | application/json | cart     | 200             | SUPUESTO |

  @negativo
  Scenario Outline: [<caso>] Eliminar un carrito con id <descripcion> (fuente: <fuente>)
    When elimino en carts el id "<id>"
    Then el status es <status>

    @defecto-FS-05
    Examples: id inexistente
      | caso   | descripcion | id   | status | fuente |
      | CRT-24 | inexistente | 9999 | 404    | HTTP   |

    Examples:
      | caso   | descripcion | id  | status | fuente   |
      | CRT-25 | no numérico | abc | 400    | CONTRATO |
