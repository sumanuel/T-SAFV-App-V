jest.mock("../../src/services/auth/sessionRefresh", () => ({
  recoverFromUnauthorized: jest.fn(),
}));
jest.mock("../../src/services/auth/sessionExpiry", () => ({
  notifySessionExpired: jest.fn(),
}));

const {
  recoverFromUnauthorized,
} = require("../../src/services/auth/sessionRefresh");
const {
  notifySessionExpired,
} = require("../../src/services/auth/sessionExpiry");
const sdk = require("../../src/services/api/sdk").default;
const { API_BASE_URL } = require("../../src/services/api/config");

const reply = (status, body = {}) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("sdk: peticiones autenticadas", () => {
  it("envia el token y devuelve { status, data }", async () => {
    global.fetch.mockResolvedValue(reply(200, [{ id: 1 }]));

    const res = await sdk.getMyNotifications("tok", 5);

    expect(res).toEqual({ status: 200, data: [{ id: 1 }] });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url.startsWith(`${API_BASE_URL}/api/notificaciones/mine`)).toBe(
      true,
    );
    expect(options.headers.Authorization).toBe("Bearer tok");
    expect(options.method).toBe("GET");
  });

  it("DELETE no manda cuerpo ni content-type", async () => {
    global.fetch.mockResolvedValue(reply(200, { message: "ok" }));

    await sdk.deleteNotification("tok", 9);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("DELETE");
    expect(options.body).toBeUndefined();
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("un error de red se devuelve como status 0 sin lanzar", async () => {
    global.fetch.mockRejectedValue(new Error("boom"));

    const res = await sdk.getMyNotifications("tok");

    expect(res.status).toBe(0);
    expect(notifySessionExpired).not.toHaveBeenCalled();
  });
});

describe("sdk: timeout", () => {
  afterEach(() => jest.useRealTimers());

  it("una peticion colgada se aborta a los 30 s y se devuelve status 0", async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new Error("AbortError")),
          );
        }),
    );

    const pending = sdk.getMyNotifications("tok");
    await jest.advanceTimersByTimeAsync(30000);

    await expect(pending).resolves.toMatchObject({ status: 0 });
    expect(notifySessionExpired).not.toHaveBeenCalled();
  });

  it("no aborta una peticion que responde a tiempo", async () => {
    global.fetch.mockResolvedValue(reply(200, []));

    await sdk.getMyNotifications("tok");

    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(false);
  });
});

describe("sdk: 401 y renovacion de sesion", () => {
  it("renueva el token y repite la peticion con el token nuevo", async () => {
    global.fetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    recoverFromUnauthorized.mockResolvedValue({
      token: "nuevo",
      expired: false,
    });

    const res = await sdk.getMyNotifications("viejo");

    expect(res).toEqual({ status: 200, data: { ok: true } });
    expect(recoverFromUnauthorized).toHaveBeenCalledWith("viejo");
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer nuevo",
    );
    expect(notifySessionExpired).not.toHaveBeenCalled();
  });

  it("si la sesion es irrecuperable avisa que expiro", async () => {
    global.fetch.mockResolvedValue(reply(401));
    recoverFromUnauthorized.mockResolvedValue({ token: null, expired: true });

    const res = await sdk.getMyNotifications("viejo");

    expect(res.status).toBe(401);
    expect(notifySessionExpired).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("si solo falta la red NO cierra la sesion", async () => {
    global.fetch.mockResolvedValue(reply(401));
    recoverFromUnauthorized.mockResolvedValue({ token: null, expired: false });

    const res = await sdk.getMyNotifications("viejo");

    expect(res.status).toBe(401);
    expect(notifySessionExpired).not.toHaveBeenCalled();
  });

  it("si el token renovado tambien recibe 401 la sesion expira (sin bucle)", async () => {
    global.fetch.mockResolvedValue(reply(401));
    recoverFromUnauthorized.mockResolvedValue({
      token: "nuevo",
      expired: false,
    });

    const res = await sdk.getMyNotifications("viejo");

    expect(res.status).toBe(401);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(notifySessionExpired).toHaveBeenCalledTimes(1);
  });

  it("un 401 sin token se trata como sesion vencida sin intentar renovar", async () => {
    global.fetch.mockResolvedValue(reply(401));

    await sdk.getMyNotifications(null);

    expect(recoverFromUnauthorized).not.toHaveBeenCalled();
    expect(notifySessionExpired).toHaveBeenCalledTimes(1);
  });

  it("otros errores (403, 500) no tocan la sesion", async () => {
    for (const status of [403, 404, 500]) {
      global.fetch.mockResolvedValue(reply(status));
      const res = await sdk.getMyNotifications("tok");
      expect(res.status).toBe(status);
    }
    expect(recoverFromUnauthorized).not.toHaveBeenCalled();
    expect(notifySessionExpired).not.toHaveBeenCalled();
  });
});

describe("sdk: fotos e incidencias", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

  it("uploadAttachment envia los bytes tal cual, con Content-Type de imagen y el token", async () => {
    global.fetch.mockResolvedValue(reply(201, { id: 9 }));

    const res = await sdk.uploadAttachment("tok", "REGISTRO", 55, bytes);

    expect(res).toEqual({ status: 201, data: { id: 9 } });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/adjuntos/REGISTRO/55`);
    expect(options.method).toBe("POST");
    expect(options.body).toBe(bytes);
    expect(options.headers["Content-Type"]).toBe("image/jpeg");
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  it("la subida usa un timeout mayor que una peticion normal (60 s)", async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new Error("AbortError")),
          );
        }),
    );

    const pending = sdk.uploadAttachment("tok", "REGISTRO", 55, bytes);
    await jest.advanceTimersByTimeAsync(30000);
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(30000);
    await expect(pending).resolves.toMatchObject({ status: 0 });
    jest.useRealTimers();
  });

  it("ante un 401 renueva la sesion y repite la subida con los mismos bytes", async () => {
    global.fetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(201, { id: 9 }));
    recoverFromUnauthorized.mockResolvedValue({
      token: "nuevo",
      expired: false,
    });

    const res = await sdk.uploadAttachment("viejo", "INCIDENCIA", 3, bytes);

    expect(res.status).toBe(201);
    expect(global.fetch.mock.calls[1][1].body).toBe(bytes);
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer nuevo",
    );
  });

  it("las peticiones JSON siguen igual (sin cabeceras de imagen)", async () => {
    global.fetch.mockResolvedValue(reply(201, { id: 1 }));

    await sdk.createFiscalRecord("tok", { unidad_id: 3 });

    const options = global.fetch.mock.calls[0][1];
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ unidad_id: 3 }));
  });

  it("createIncidencia, listado y cambio de estado usan los endpoints nuevos", async () => {
    global.fetch.mockResolvedValue(reply(200, []));

    await sdk.createIncidencia("tok", { tipo: "OTRO" });
    await sdk.getAssociationIncidencias("tok", 1, {
      estado: "ABIERTA",
      limit: 20,
    });
    await sdk.getIncidencia("tok", 7);
    await sdk.updateIncidenciaEstado("tok", 7, "CERRADA");

    const calls = global.fetch.mock.calls.map(([url, o]) => [
      o.method,
      url.replace(API_BASE_URL, ""),
    ]);
    expect(calls).toEqual([
      ["POST", "/api/incidencias"],
      ["GET", "/api/incidencias/asociaciones/1?estado=ABIERTA&limit=20"],
      ["GET", "/api/incidencias/7"],
      ["PATCH", "/api/incidencias/7/estado"],
    ]);
    expect(JSON.parse(global.fetch.mock.calls[3][1].body)).toEqual({
      estado: "CERRADA",
    });
  });

  it("getAttachmentSummary pide los ids separados por coma", async () => {
    global.fetch.mockResolvedValue(
      reply(200, [{ entidad_id: 11, adjunto_id: 4 }]),
    );

    const res = await sdk.getAttachmentSummary("tok", [11, 12, 13]);

    expect(res.data).toEqual([{ entidad_id: 11, adjunto_id: 4 }]);
    expect(global.fetch.mock.calls[0][0]).toBe(
      `${API_BASE_URL}/api/adjuntos/resumen/registros?ids=11%2C12%2C13`,
    );
  });

  it("getAttachmentSource da la URL y la cabecera de autenticacion para <Image>", () => {
    expect(sdk.getAttachmentSource("tok", 4)).toEqual({
      uri: `${API_BASE_URL}/api/adjuntos/4`,
      headers: { Authorization: "Bearer tok" },
    });
  });
});
