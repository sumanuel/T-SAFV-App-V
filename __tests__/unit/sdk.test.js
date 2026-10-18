jest.mock("../../src/services/auth/sessionRefresh", () => ({
  recoverFromUnauthorized: jest.fn(),
}));
jest.mock("../../src/services/auth/sessionExpiry", () => ({
  notifySessionExpired: jest.fn(),
}));

const { recoverFromUnauthorized } = require("../../src/services/auth/sessionRefresh");
const { notifySessionExpired } = require("../../src/services/auth/sessionExpiry");
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
    expect(url.startsWith(`${API_BASE_URL}/api/notificaciones/mine`)).toBe(true);
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

describe("sdk: 401 y renovacion de sesion", () => {
  it("renueva el token y repite la peticion con el token nuevo", async () => {
    global.fetch.mockResolvedValueOnce(reply(401)).mockResolvedValueOnce(reply(200, { ok: true }));
    recoverFromUnauthorized.mockResolvedValue({ token: "nuevo", expired: false });

    const res = await sdk.getMyNotifications("viejo");

    expect(res).toEqual({ status: 200, data: { ok: true } });
    expect(recoverFromUnauthorized).toHaveBeenCalledWith("viejo");
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer nuevo");
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
    recoverFromUnauthorized.mockResolvedValue({ token: "nuevo", expired: false });

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
