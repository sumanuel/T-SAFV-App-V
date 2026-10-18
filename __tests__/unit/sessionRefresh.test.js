jest.mock("../../src/services/auth/tokenStorage", () => ({
  getRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(async () => {}),
  removeRefreshToken: jest.fn(async () => {}),
  setToken: jest.fn(async () => {}),
}));

const tokenStorage = require("../../src/services/auth/tokenStorage");
const {
  recoverFromUnauthorized,
  refreshAccessToken,
  resetSessionRefresh,
  setSessionRefreshedHandler,
} = require("../../src/services/auth/sessionRefresh");

const jsonResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

const okSession = (n) =>
  jsonResponse(200, { token: `access-${n}`, refresh_token: `refresh-${n}`, user: { id: 1 } });

beforeEach(() => {
  jest.clearAllMocks();
  resetSessionRefresh();
  setSessionRefreshedHandler(null);
  global.fetch = jest.fn();
  tokenStorage.getRefreshToken.mockResolvedValue("refresh-0");
});

describe("refreshAccessToken", () => {
  it("sin refresh token guardado la sesion se da por vencida (sin llamar a la API)", async () => {
    tokenStorage.getRefreshToken.mockResolvedValue(null);

    await expect(refreshAccessToken("viejo")).resolves.toEqual({ status: "expired" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("canjea el refresh token, guarda ambos tokens y avisa al contexto", async () => {
    global.fetch.mockResolvedValue(okSession(1));
    const onRefreshed = jest.fn();
    setSessionRefreshedHandler(onRefreshed);

    const result = await refreshAccessToken("viejo");

    expect(result).toEqual({ status: "ok", token: "access-1" });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ refresh_token: "refresh-0" });
    expect(tokenStorage.setToken).toHaveBeenCalledWith("access-1");
    expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith("refresh-1");
    expect(onRefreshed).toHaveBeenCalledWith({ token: "access-1", user: { id: 1 } });
  });

  it("varias peticiones con 401 a la vez comparten UNA sola renovacion", async () => {
    let release;
    global.fetch.mockReturnValue(new Promise((resolve) => (release = resolve)));

    const calls = [refreshAccessToken("a"), refreshAccessToken("a"), refreshAccessToken("b")];
    await Promise.resolve();
    release(okSession(1));
    const results = await Promise.all(calls);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    results.forEach((r) => expect(r).toEqual({ status: "ok", token: "access-1" }));
  });

  it("un token ya reemplazado reutiliza el nuevo sin volver a rotar el refresh token", async () => {
    global.fetch.mockResolvedValue(okSession(1));

    await refreshAccessToken("viejo");
    const again = await refreshAccessToken("viejo");

    expect(again).toEqual({ status: "ok", token: "access-1" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401])("un %i del servidor descarta el refresh token y vence la sesion", async (status) => {
    global.fetch.mockResolvedValue(jsonResponse(status, { reason: "reused" }));

    await expect(refreshAccessToken("x")).resolves.toEqual({ status: "expired" });
    expect(tokenStorage.removeRefreshToken).toHaveBeenCalled();
  });

  it("sin red no se cierra la sesion", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));

    await expect(refreshAccessToken("x")).resolves.toEqual({ status: "offline" });
    expect(tokenStorage.removeRefreshToken).not.toHaveBeenCalled();
  });

  it("un error 5xx del servidor tampoco cierra la sesion", async () => {
    global.fetch.mockResolvedValue(jsonResponse(503, {}));

    await expect(refreshAccessToken("x")).resolves.toEqual({ status: "offline" });
    expect(tokenStorage.removeRefreshToken).not.toHaveBeenCalled();
  });

  it("una respuesta incompleta se trata como fallo temporal", async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { token: "solo-access" }));

    await expect(refreshAccessToken("x")).resolves.toEqual({ status: "offline" });
    expect(tokenStorage.setToken).not.toHaveBeenCalled();
  });

  it("tras un fallo se puede volver a intentar", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("offline"));
    global.fetch.mockResolvedValueOnce(okSession(2));

    await refreshAccessToken("x");
    const retry = await refreshAccessToken("x");

    expect(retry).toEqual({ status: "ok", token: "access-2" });
  });
});

describe("recoverFromUnauthorized", () => {
  it("expone solo token y expired", async () => {
    global.fetch.mockResolvedValue(okSession(1));
    await expect(recoverFromUnauthorized("v")).resolves.toEqual({ token: "access-1", expired: false });
  });

  it("marca expired unicamente cuando la sesion es irrecuperable", async () => {
    global.fetch.mockResolvedValue(jsonResponse(401, {}));
    await expect(recoverFromUnauthorized("v")).resolves.toEqual({ token: null, expired: true });

    resetSessionRefresh();
    global.fetch.mockRejectedValue(new TypeError("offline"));
    await expect(recoverFromUnauthorized("v")).resolves.toEqual({ token: null, expired: false });
  });
});
