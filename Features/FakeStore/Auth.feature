@fakestore @auth @regression
Feature: FakeStoreAPI - Auth
  Como usuario de la tienda
  Quiero iniciar sesión
  Para obtener un token de acceso

  # Credenciales demo públicas de FakeStoreAPI.
  @smoke
  Scenario Outline: [<caso>] Iniciar sesión con el usuario "<username>" (fuente: <fuente>)
    When inicio sesión con el body:
      """
      { "username": "<username>", "password": "<password>" }
      """
    Then el status es <status>
    And el header "Content-Type" contiene "<content_type>"
    And el body cumple el contrato "<contrato>"

    @defecto-FS-06
    Examples: el login responde un status distinto al contrato
      | caso   | username | password | status | content_type     | contrato | fuente   |
      | AUT-01 | johnd    | m38rmF$  | 200    | application/json | login    | CONTRATO |
      | AUT-02 | mor_2314 | 83r5^_   | 200    | application/json | login    | CONTRATO |

  @negativo
  Scenario Outline: [<caso>] Rechazar el inicio de sesión: <descripcion> (fuente: <fuente>)
    When inicio sesión con el body:
      """
      <body>
      """
    Then el status es <status>
    And la respuesta incluye un mensaje de error

    @smoke
    Examples: camino crítico
      | caso   | descripcion           | body                                         | status | fuente |
      | AUT-03 | contraseña incorrecta | {"username":"johnd","password":"incorrecta"} | 401    | HTTP   |

    Examples:
      | caso   | descripcion         | body                                             | status | fuente   |
      | AUT-04 | usuario inexistente | {"username":"no-existe","password":"incorrecta"} | 401    | HTTP     |
      | AUT-05 | sin campos          | {}                                               | 400    | CONTRATO |
      | AUT-06 | sin password        | {"username":"johnd"}                             | 400    | CONTRATO |
      | AUT-07 | sin username        | {"password":"m38rmF$"}                           | 400    | CONTRATO |
      | AUT-08 | JSON mal formado    | {"username":                                     | 400    | CONTRATO |
