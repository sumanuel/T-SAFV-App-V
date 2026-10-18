jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../src/services/api/sdk", () => ({
  __esModule: true,
  default: { createFiscalRecord: jest.fn() },
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");
const sdk = require("../../src/services/api/sdk").default;
const queue = require("../../src/services/offline/fiscalQueue");

const payload = {
  unidad_id: 3,
  asociacion_id: 1,
  chofer: "Pedro",
  destino: "Caracas",
};
const WHEN = "2026-10-18T10:00:00.000Z";
const reply = (status, data = {}) => ({ status, data });

const add = (id, userId = 7, extra = {}) =>
  queue.enqueueFiscalRecord({
    id,
    userId,
    payload,
    capturedAt: WHEN,
    ...extra,
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("isRetryableStatus", () => {
  it.each([0, 401, 408, 429, 500, 502, 503])("%i se reintenta", (status) => {
    expect(queue.isRetryableStatus(status)).toBe(true);
  });
  it.each([200, 201, 400, 403, 404, 409, 422])(
    "%i NO se reintenta",
    (status) => {
      expect(queue.isRetryableStatus(status)).toBe(false);
    },
  );
});

describe("enqueue / discard", () => {
  it("guarda el registro con su id, usuario y hora de captura", async () => {
    await add("a");

    const [item] = await queue.getQueue();
    expect(item).toMatchObject({
      id: "a",
      userId: "7",
      capturedAt: WHEN,
      status: "pending",
      attempts: 0,
    });
    expect(item.payload).toEqual(payload);
  });

  it("varios enqueue seguidos no se pisan entre si", async () => {
    await Promise.all([add("a"), add("b"), add("c")]);

    expect((await queue.getQueue()).map((i) => i.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("discard elimina solo ese registro", async () => {
    await add("a");
    await add("b");

    await queue.discardFiscalRecord("a");

    expect((await queue.getQueue()).map((i) => i.id)).toEqual(["b"]);
  });

  it("avisa a los suscriptores en cada cambio y permite darse de baja", async () => {
    const listener = jest.fn();
    const unsubscribe = queue.subscribe(listener);

    await add("a");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toHaveLength(1);

    unsubscribe();
    await add("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("una cola corrupta en disco se ignora en vez de romper", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await AsyncStorage.setItem(queue.QUEUE_KEY, "{no-es-json");

    expect(await queue.getQueue()).toEqual([]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("flushFiscalQueue", () => {
  it("envia con client_request_id y la hora original, y retira lo enviado", async () => {
    await add("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201));

    const summary = await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(summary).toMatchObject({
      sent: 1,
      failed: 0,
      remaining: 0,
      stopped: false,
    });
    expect(sdk.createFiscalRecord).toHaveBeenCalledWith("tok", {
      ...payload,
      client_request_id: "a",
      fecha_hora_registro: WHEN,
    });
    expect(await queue.getQueue()).toEqual([]);
  });

  it("un 200 (reintento ya guardado por el servidor) tambien cuenta como enviado", async () => {
    await add("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(200));

    const summary = await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(summary.sent).toBe(1);
    expect(await queue.getQueue()).toEqual([]);
  });

  it.each([0, 500, 503, 429, 401])(
    "ante %i se detiene, conserva todo y cuenta el intento",
    async (status) => {
      await add("a");
      await add("b");
      sdk.createFiscalRecord.mockResolvedValue(reply(status));

      const summary = await queue.flushFiscalQueue({ token: "tok", userId: 7 });

      expect(summary).toMatchObject({ sent: 0, stopped: true, remaining: 2 });
      expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
      const items = await queue.getQueue();
      expect(items.map((i) => i.status)).toEqual(["pending", "pending"]);
      expect(items[0].attempts).toBe(1);
    },
  );

  it("envia en orden y se detiene en el primer fallo temporal", async () => {
    await add("a");
    await add("b");
    await add("c");
    sdk.createFiscalRecord
      .mockResolvedValueOnce(reply(201))
      .mockResolvedValueOnce(reply(0))
      .mockResolvedValue(reply(201));

    const summary = await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(summary).toMatchObject({ sent: 1, stopped: true, remaining: 2 });
    expect((await queue.getQueue()).map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("un rechazo definitivo se marca fallido con su motivo y no frena el resto", async () => {
    await add("a");
    await add("b");
    sdk.createFiscalRecord
      .mockResolvedValueOnce(
        reply(403, { message: "No eres fiscal de esta asociación" }),
      )
      .mockResolvedValueOnce(reply(201));

    const summary = await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(summary).toMatchObject({
      sent: 1,
      failed: 1,
      remaining: 0,
      stopped: false,
    });
    const [failed] = await queue.getQueue();
    expect(failed).toMatchObject({
      id: "a",
      status: "failed",
      lastError: "No eres fiscal de esta asociación",
    });
  });

  it("los fallidos no se reenvian en el siguiente intento", async () => {
    await add("a");
    sdk.createFiscalRecord.mockResolvedValueOnce(
      reply(400, { message: "mal" }),
    );
    await queue.flushFiscalQueue({ token: "tok", userId: 7 });
    sdk.createFiscalRecord.mockClear();

    await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
  });

  it("solo envia los registros del usuario con sesion activa", async () => {
    await add("mio", 7);
    await add("ajeno", 8);
    sdk.createFiscalRecord.mockResolvedValue(reply(201));

    await queue.flushFiscalQueue({ token: "tok", userId: 7 });

    expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
    expect(sdk.createFiscalRecord.mock.calls[0][1].client_request_id).toBe(
      "mio",
    );
    expect((await queue.getQueue()).map((i) => i.id)).toEqual(["ajeno"]);
  });

  it("llamadas simultaneas comparten una sola ejecucion (sin envios duplicados)", async () => {
    await add("a");
    let release;
    sdk.createFiscalRecord.mockReturnValue(
      new Promise((resolve) => (release = resolve)),
    );

    const first = queue.flushFiscalQueue({ token: "tok", userId: 7 });
    const second = queue.flushFiscalQueue({ token: "tok", userId: 7 });
    expect(second).toBe(first);
    await new Promise((r) => setImmediate(r));
    release(reply(201));
    await first;

    expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
  });

  it("sin token o usuario no hace nada", async () => {
    await add("a");

    expect(
      await queue.flushFiscalQueue({ token: null, userId: 7 }),
    ).toMatchObject({ sent: 0 });
    expect(
      await queue.flushFiscalQueue({ token: "tok", userId: undefined }),
    ).toMatchObject({ sent: 0 });
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
  });
});
