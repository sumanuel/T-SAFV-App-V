jest.mock("../../src/services/auth/tokenStorage", () => ({
  getToken: jest.fn(),
}));
jest.mock("../../src/services/auth/sessionRefresh", () => ({
  recoverFromUnauthorized: jest.fn(),
}));
jest.mock("../../src/services/auth/sessionExpiry", () => ({
  notifySessionExpired: jest.fn(),
}));

const { getToken } = require("../../src/services/auth/tokenStorage");
const {
  recoverFromUnauthorized,
} = require("../../src/services/auth/sessionRefresh");
const {
  notifySessionExpired,
} = require("../../src/services/auth/sessionExpiry");
const apiClient = require("../../src/services/api/apiClient").default;

const reply = (status, body = {}) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  getToken.mockResolvedValue("tok");
});

describe("apiClient (cliente de autenticacion)", () => {
  it("devuelve { data } en una respuesta exitosa", async () => {
    global.fetch.mockResolvedValue(reply(200, { token: "t" }));

    const res = await apiClient.post("/api/auth/login", {
      email: "a@b.c",
      password: "x",
    });

    expect(res.data).toEqual({ token: "t" });
    const [, options] = global.fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ email: "a@b.c", password: "x" });
  });

  it("las rutas publicas no envian token", async () => {
    global.fetch.mockResolvedValue(reply(200));

    await apiClient.post("/api/auth/login", {});
    await apiClient.post("/api/auth/forgot-password", {});

    for (const [, options] of global.fetch.mock.calls) {
      expect(options.headers.Authorization).toBeUndefined();
    }
    expect(getToken).not.toHaveBeenCalled();
  });

  it("las rutas con sesion toman el token guardado", async () => {
    global.fetch.mockResolvedValue(reply(200, []));

    await apiClient.get("/api/invitaciones/mine");

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer tok",
    );
  });

  it("un error HTTP lanza con response.status y response.data (como axios)", async () => {
    global.fetch.mockResolvedValue(
      reply(400, { message: "Invalid credentials" }),
    );

    await expect(apiClient.post("/api/auth/login", {})).rejects.toMatchObject({
      response: { status: 400, data: { message: "Invalid credentials" } },
    });
  });

  it('sin conexion lanza con message "Network Error" y sin response', async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));

    const error = await apiClient.get("/api/invitaciones/mine").catch((e) => e);

    expect(error.message).toBe("Network Error");
    expect(error.response).toBeUndefined();
  });

  it("un 401 en login NO se toma como sesion vencida", async () => {
    global.fetch.mockResolvedValue(reply(401, { message: "no" }));

    await expect(apiClient.post("/api/auth/login", {})).rejects.toBeTruthy();

    expect(notifySessionExpired).not.toHaveBeenCalled();
    expect(recoverFromUnauthorized).not.toHaveBeenCalled();
  });

  it("un 401 en una ruta con sesion renueva el token y reintenta", async () => {
    global.fetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    recoverFromUnauthorized.mockResolvedValue({
      token: "nuevo",
      expired: false,
    });

    const res = await apiClient.patch("/api/auth/push-token", {
      push_token: "x",
    });

    expect(res.data).toEqual({ ok: true });
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer nuevo",
    );
  });
});
