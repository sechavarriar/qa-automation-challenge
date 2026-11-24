@fakestore @products @regression
Feature: FakeStoreAPI - Products
  Como consumidor de la tienda
  Quiero consultar y administrar productos
  Para mantener el catálogo al día

  @smoke
  Scenario Outline: [<caso>] Listar productos (fuente: <fuente>)
    When consulto el listado de products
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"

    Examples:
      | caso   | status | content_type     | contrato | fuente    |
      | PRD-01 | 200    | application/json | product  | ENUNCIADO |

  Scenario Outline: [<caso>] Limitar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de products con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And la lista tiene <cantidad> elementos

    Examples:
      | caso   | parametros | status | content_type     | contrato | cantidad | fuente   |
      | PRD-02 | limit=1    | 200    | application/json | product  | 1        | CONTRATO |
      | PRD-03 | limit=5    | 200    | application/json | product  | 5        | CONTRATO |

  Scenario Outline: [<caso>] Ordenar el listado con "<parametros>" (fuente: <fuente>)
    When consulto el listado de products con los parámetros "<parametros>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And los ids de la lista están en orden "<orden>"

    Examples:
      | caso   | parametros | status | content_type     | contrato | orden | fuente   |
      | PRD-04 | sort=asc   | 200    | application/json | product  | asc   | CONTRATO |
      | PRD-05 | sort=desc  | 200    | application/json | product  | desc  | CONTRATO |

  Scenario Outline: [<caso>] Listar categorías (fuente: <fuente>)
    When consulto las categorías de productos
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"

    Examples:
      | caso   | status | content_type     | contrato | fuente   |
      | PRD-06 | 200    | application/json | category | CONTRATO |

  Scenario Outline: [<caso>] Listar productos de la categoría "<categoria>" (fuente: <fuente>)
    When consulto los productos de la categoría "<categoria>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body es una lista no vacía donde cada elemento cumple el contrato "<contrato>"
    And cada elemento de la lista tiene "category" con valor "<categoria>"

    Examples:
      | caso   | categoria   | status | content_type     | contrato | fuente   |
      | PRD-07 | jewelery    | 200    | application/json | product  | CONTRATO |
      | PRD-08 | electronics | 200    | application/json | product  | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Consultar el producto <id> (fuente: <fuente>)
    When consulto en products el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | fuente    |
      | PRD-09 | 1  | 200    | application/json | product  | ENUNCIADO |
      | PRD-10 | 20 | 200    | application/json | product  | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Consultar un producto con id <descripcion> (fuente: <fuente>)
    When consulto en products el id "<id>"
    Then el status es <status>

    @defecto-FS-01
    Examples: id inexistente
      | caso   | descripcion     | id   | status | fuente   |
      | PRD-11 | inexistente     | 9999 | 404    | HTTP     |
      | PRD-12 | límite inferior | 0    | 404    | HTTP     |

    @defecto-FS-02
    Examples: id no numérico
      | caso   | descripcion     | id   | status | fuente   |
      | PRD-13 | no numérico     | abc  | 400    | CONTRATO |

  @smoke
  Scenario Outline: [<caso>] Crear el producto "<title>" (fuente: <fuente>)
    When creo en products un registro con el body:
      """
      {
        "title": "<title>",
        "price": <price>,
        "description": "<description>",
        "category": "<category>",
        "image": "<image>"
      }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And lo recibido coincide con lo enviado

    Examples:
      | caso   | title           | price  | description       | category    | image                           | status | content_type     | contrato | fuente    |
      | PRD-14 | Teclado {unico} | 120.50 | Teclado mecánico  | electronics | https://example.com/teclado.png | 201    | application/json | product  | ENUNCIADO |
      | PRD-15 | Muestra {unico} | 0      | Producto gratuito | jewelery    | https://example.com/muestra.png | 201    | application/json | product  | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Crear un producto con body inválido: <descripcion> (fuente: <fuente>)
    When creo en products un registro con el body:
      """
      <body>
      """
    Then el status es <status>
    And la respuesta incluye un mensaje de error

    @defecto-FS-03
    Examples: body que incumple el contrato
      | caso   | descripcion              | body                                                                                                                           | status | fuente    |
      | PRD-16 | sin campos               | {}                                                                                                                             | 400    | ENUNCIADO |
      | PRD-17 | price con tipo incorrecto | {"title":"Teclado","price":"caro","description":"Teclado","category":"electronics","image":"https://example.com/teclado.png"} | 400    | CONTRATO  |

    Examples:
      | caso   | descripcion              | body                                                                                                                           | status | fuente    |
      | PRD-18 | JSON mal formado         | {"title":                                                                                                                      | 400    | ENUNCIADO |

  Scenario Outline: [<caso>] Actualizar con <metodo> el producto <id> (fuente: <fuente>)
    When actualizo con <metodo> en products el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    And lo recibido coincide con lo enviado

    Examples:
      | caso   | metodo | id | body                                                                                                                                       | status | content_type     | contrato          | fuente    |
      | PRD-19 | PUT    | 7  | {"title":"Teclado {unico}","price":99.9,"description":"Nuevo","category":"electronics","image":"https://example.com/teclado.png"} | 200    | application/json | product           | ENUNCIADO |
      | PRD-20 | PATCH  | 8  | {"price":15.75}                                                                                                                            | 200    | application/json | identified-record | ENUNCIADO |

  @negativo
  Scenario Outline: [<caso>] Actualizar con <metodo> un producto con id <descripcion> (fuente: <fuente>)
    When actualizo con <metodo> en products el id "<id>" con el body:
      """
      <body>
      """
    Then el status es <status>

    @defecto-FS-04
    Examples: id inexistente
      | caso   | metodo | descripcion | id   | body               | status | fuente   |
      | PRD-21 | PUT    | inexistente | 9999 | {"title":"Teclado"} | 404    | HTTP     |
      | PRD-22 | PATCH  | inexistente | 9999 | {"title":"Teclado"} | 404    | HTTP     |

    Examples:
      | caso   | metodo | descripcion | id   | body               | status | fuente   |
      | PRD-23 | PUT    | no numérico | abc  | {"title":"Teclado"} | 400    | CONTRATO |

  Scenario Outline: [<caso>] Eliminar el producto <id> y consultarlo de nuevo (fuente: <fuente>)
    # La documentación oficial indica que nada se borra de la base de datos.
    When elimino en products el id "<id>"
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>
    When consulto en products el id "<id>"
    Then el status es <status_consulta>
    And el body cumple el contrato "<contrato>"
    And el id recibido es <id>

    Examples:
      | caso   | id | status | content_type     | contrato | status_consulta | fuente   |
      | PRD-24 | 6  | 200    | application/json | product  | 200             | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Eliminar un producto con id <descripcion> (fuente: <fuente>)
    When elimino en products el id "<id>"
    Then el status es <status>

    @defecto-FS-05
    Examples: id inexistente
      | caso   | descripcion | id   | status | fuente   |
      | PRD-25 | inexistente | 9999 | 404    | HTTP     |

    Examples:
      | caso   | descripcion | id   | status | fuente   |
      | PRD-26 | no numérico | abc  | 400    | CONTRATO |
