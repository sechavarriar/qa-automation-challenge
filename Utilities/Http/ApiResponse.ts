/** Respuesta ya leída. El cuerpo se guarda como texto para poder consultarlo varias veces. */
export class ApiResponse {
  constructor(
    readonly status: number,
    private readonly headers: Record<string, string>,
    readonly rawBody: string,
  ) {}

  header(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  json(): unknown {
    try {
      return JSON.parse(this.rawBody);
    } catch {
      const received = this.rawBody === '' ? '(vacío)' : this.rawBody.slice(0, 200);
      throw new Error(`Se esperaba un body JSON válido. Recibido: ${received}`);
    }
  }
}
