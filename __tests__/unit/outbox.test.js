jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../src/services/api/sdk", () => ({
  __esModule: true,
  default: {
    createFiscalRecord: jest.fn(),
    createIncidencia: jest.fn(),
    uploadAttachment: jest.fn(),
  },
}));
jest.mock("../../src/services/media/photoFiles", () => ({
  photoExists: jest.fn(() => true),
  readPhotoBytes: jest.fn(
    async (path) => new Uint8Array([1, 2, 3, path.length]),
  ),
  deletePhoto: jest.fn(),
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");
const sdk = require("../../src/services/api/sdk").default;
const files = require("../../src/services/media/photoFiles");
const outbox = require("../../src/services/offline/outbox");

const payload = {
  unidad_id: 3,
  asociacion_id: 1,
  chofer: "Pedro",
  destino: "Caracas",
};
const incidentPayload = {
  asociacion_id: 1,
  tipo: "INFRACCION",
  descripcion: "Exceso de pasajeros",
};
const WHEN = "2026-10-18T10:00:00.000Z";
const reply = (status, data = {}) => ({ status, data });

const add = (id, userId = 7, extra = {}) =>
  outbox.enqueue({ id, userId, payload, capturedAt: WHEN, ...extra });

const addIncident = (id, extra = {}) =>
  outbox.enqueue({
    id,
    kind: outbox.KINDS.INCIDENCIA,
    userId: 7,
    payload: incidentPayload,
    capturedAt: WHEN,
    ...extra,
  });

const flush = (userId = 7) => outbox.flushOutbox({ token: "tok", userId });

beforeEach(async () => {
  jest.clearAllMocks();
  files.photoExists.mockReturnValue(true);
  await AsyncStorage.clear();
});

describe("isRetryableStatus", () => {
  it.each([0, 401, 408, 429, 500, 502, 503])("%i se reintenta", (status) => {
    expect(outbox.isRetryableStatus(status)).toBe(true);
  });
  it.each([200, 201, 400, 403, 404, 409, 422])(
    "%i NO se reintenta",
    (status) => {
      expect(outbox.isRetryableStatus(status)).toBe(false);
    },
  );
});

describe("enqueue / discardItem", () => {
  it("guarda el elemento con su tipo, id, usuario y hora de captura", async () => {
    await add("a");

    const [item] = await outbox.getQueue();
    expect(item).toMatchObject({
      id: "a",
      kind: "fiscalizacion",
      userId: "7",
      capturedAt: WHEN,
      status: "pending",
      attempts: 0,
      remoteId: null,
      photos: [],
    });
    expect(item.payload).toEqual(payload);
  });

  it("guarda solo la ruta de las fotos", async () => {
    await add("a", 7, {
      photos: [{ path: "file:///docs/pending-photos/a.jpg", width: 1280 }],
    });

    const [item] = await outbox.getQueue();
    expect(item.photos).toEqual([
      { path: "file:///docs/pending-photos/a.jpg" },
    ]);
  });

  it("varios enqueue seguidos no se pisan entre si", async () => {
    await Promise.all([add("a"), add("b"), addIncident("c")]);

    expect((await outbox.getQueue()).map((i) => i.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("discard elimina el elemento y borra sus fotos sin subir", async () => {
    await add("a", 7, { photos: [{ path: "p1.jpg" }] });
    await add("b");

    await outbox.discardItem("a");

    expect((await outbox.getQueue()).map((i) => i.id)).toEqual(["b"]);
    expect(files.deletePhoto).toHaveBeenCalledWith("p1.jpg");
  });

  it("avisa a los suscriptores en cada cambio y permite darse de baja", async () => {
    const listener = jest.fn();
    const unsubscribe = outbox.subscribe(listener);

    await add("a");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await add("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("una cola corrupta en disco se ignora en vez de romper", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await AsyncStorage.setItem(outbox.QUEUE_KEY, "{no-es-json");

    expect(await outbox.getQueue()).toEqual([]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("lo pendiente de versiones anteriores (sin tipo ni fotos) se sigue enviando", async () => {
    await AsyncStorage.setItem(
      outbox.QUEUE_KEY,
      JSON.stringify([
        {
          id: "viejo",
          userId: "7",
          payload,
          capturedAt: WHEN,
          attempts: 0,
          status: "pending",
        },
      ]),
    );
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 1 }));

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, failed: 0 });
    expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
    expect(await outbox.getQueue()).toEqual([]);
  });
});

describe("flush: fiscalizaciones sin foto", () => {
  it("envia con client_request_id y la hora original, y retira lo enviado", async () => {
    await add("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));

    const summary = await flush();

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
    expect(await outbox.getQueue()).toEqual([]);
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });

  it("un 200 (el servidor ya lo tenia) tambien cuenta como enviado", async () => {
    await add("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(200, { id: 55 }));

    expect((await flush()).sent).toBe(1);
  });

  it.each([0, 500, 503, 429, 401])(
    "ante %i se detiene, conserva todo y cuenta el intento",
    async (status) => {
      await add("a");
      await add("b");
      sdk.createFiscalRecord.mockResolvedValue(reply(status));

      const summary = await flush();

      expect(summary).toMatchObject({ sent: 0, stopped: true, remaining: 2 });
      expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
      const items = await outbox.getQueue();
      expect(items.map((i) => i.status)).toEqual(["pending", "pending"]);
      expect(items[0].attempts).toBe(1);
    },
  );

  it("envia en orden y se detiene en el primer fallo temporal", async () => {
    await add("a");
    await add("b");
    await add("c");
    sdk.createFiscalRecord
      .mockResolvedValueOnce(reply(201, { id: 1 }))
      .mockResolvedValueOnce(reply(0))
      .mockResolvedValue(reply(201, { id: 3 }));

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, stopped: true, remaining: 2 });
    expect((await outbox.getQueue()).map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("un rechazo definitivo se marca fallido con su motivo y no frena el resto", async () => {
    await add("a");
    await add("b");
    sdk.createFiscalRecord
      .mockResolvedValueOnce(
        reply(403, { message: "No eres fiscal de esta asociación" }),
      )
      .mockResolvedValueOnce(reply(201, { id: 2 }));

    const summary = await flush();

    expect(summary).toMatchObject({
      sent: 1,
      failed: 1,
      remaining: 0,
      stopped: false,
    });
    const [failed] = await outbox.getQueue();
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
    await flush();
    sdk.createFiscalRecord.mockClear();

    await flush();

    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
  });

  it("solo envia los elementos del usuario con sesion activa", async () => {
    await add("mio", 7);
    await add("ajeno", 8);
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 1 }));

    await flush(7);

    expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
    expect((await outbox.getQueue()).map((i) => i.id)).toEqual(["ajeno"]);
  });

  it("llamadas simultaneas comparten una sola ejecucion (sin envios duplicados)", async () => {
    await add("a");
    let release;
    sdk.createFiscalRecord.mockReturnValue(
      new Promise((resolve) => (release = resolve)),
    );

    const first = flush();
    const second = flush();
    expect(second).toBe(first);
    await new Promise((r) => setImmediate(r));
    release(reply(201, { id: 1 }));
    await first;

    expect(sdk.createFiscalRecord).toHaveBeenCalledTimes(1);
  });

  it("sin token o usuario no hace nada", async () => {
    await add("a");

    expect(await outbox.flushOutbox({ token: null, userId: 7 })).toMatchObject({
      sent: 0,
    });
    expect(
      await outbox.flushOutbox({ token: "tok", userId: undefined }),
    ).toMatchObject({ sent: 0 });
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
  });
});

describe("flush: incidencias", () => {
  it("se envian con su propio endpoint, client_request_id y fecha_hora_evento", async () => {
    await addIncident("i1");
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));

    const summary = await flush();

    expect(summary.sent).toBe(1);
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
    expect(sdk.createIncidencia).toHaveBeenCalledWith("tok", {
      ...incidentPayload,
      client_request_id: "i1",
      fecha_hora_evento: WHEN,
    });
  });

  it("un rechazo definitivo queda visible con su tipo", async () => {
    await addIncident("i1");
    sdk.createIncidencia.mockResolvedValue(
      reply(400, { errors: [{ msg: "tipo invalido" }] }),
    );

    await flush();

    const [item] = await outbox.getQueue();
    expect(item).toMatchObject({
      kind: "incidencia",
      status: "failed",
      lastError: "tipo invalido",
    });
  });
});

describe("flush: fotos", () => {
  const withPhoto = (id) =>
    add(id, 7, { photos: [{ path: `file:///p/${id}.jpg` }] });

  it("crea el registro y despues sube la foto con el id que devolvio la API", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201, { id: 900 }));

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, photosDropped: 0 });
    expect(sdk.uploadAttachment).toHaveBeenCalledTimes(1);
    const [token, entity, remoteId, bytes] = sdk.uploadAttachment.mock.calls[0];
    expect([token, entity, remoteId]).toEqual(["tok", "REGISTRO", 55]);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(files.deletePhoto).toHaveBeenCalledWith("file:///p/a.jpg");
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("las fotos de incidencias se suben como INCIDENCIA", async () => {
    await addIncident("i1", {
      photos: [{ path: "x1.jpg" }, { path: "x2.jpg" }],
    });
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201));

    await flush();

    expect(sdk.uploadAttachment.mock.calls.map((c) => [c[1], c[2]])).toEqual([
      ["INCIDENCIA", 9],
      ["INCIDENCIA", 9],
    ]);
  });

  it("si falla la foto por la red, el registro NO se vuelve a crear en el siguiente intento", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValueOnce(reply(0));

    const first = await flush();

    expect(first).toMatchObject({ sent: 0, stopped: true });
    const [pending] = await outbox.getQueue();
    expect(pending).toMatchObject({ status: "pending", remoteId: 55 });
    expect(files.deletePhoto).not.toHaveBeenCalled();

    sdk.uploadAttachment.mockResolvedValueOnce(reply(201));
    sdk.createFiscalRecord.mockClear();

    const second = await flush();

    expect(second.sent).toBe(1);
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("una foto ya subida no se vuelve a subir", async () => {
    await add("a", 7, { photos: [{ path: "a.jpg" }, { path: "b.jpg" }] });
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment
      .mockResolvedValueOnce(reply(201))
      .mockResolvedValueOnce(reply(503));

    await flush();
    sdk.uploadAttachment.mockClear();
    sdk.uploadAttachment.mockResolvedValue(reply(201));

    await flush();

    expect(sdk.uploadAttachment).toHaveBeenCalledTimes(1);
    expect(files.readPhotoBytes).toHaveBeenLastCalledWith("b.jpg");
  });

  it("un 409 (el servidor ya tiene la foto) se da por subida", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(200, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(
      reply(409, { message: "Esta fiscalización ya tiene foto" }),
    );

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, photosDropped: 0 });
    expect(files.deletePhoto).toHaveBeenCalledWith("file:///p/a.jpg");
  });

  it.each([413, 415, 403, 400])(
    "una foto rechazada con %i se descarta pero el registro queda enviado",
    async (status) => {
      await withPhoto("a");
      sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
      sdk.uploadAttachment.mockResolvedValue(reply(status, { message: "no" }));

      const summary = await flush();

      expect(summary).toMatchObject({ sent: 1, photosDropped: 1, failed: 0 });
      expect(files.deletePhoto).toHaveBeenCalledWith("file:///p/a.jpg");
      expect(await outbox.getQueue()).toEqual([]);
    },
  );

  it("con la API sin actualizar (404 sin cuerpo = ruta inexistente) la foto se conserva y se reintenta", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue({ status: 404, data: null });

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 0, stopped: true, photosDropped: 0 });
    expect(files.deletePhoto).not.toHaveBeenCalled();
    expect((await outbox.getQueue())[0].remoteId).toBe(55);
  });

  it("un 404 con mensaje (registro inexistente) si descarta la foto", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(
      reply(404, { message: "Registro no encontrado" }),
    );

    expect((await flush()).photosDropped).toBe(1);
  });

  it("si el archivo de la foto ya no existe, se envia el registro sin ella", async () => {
    await withPhoto("a");
    files.photoExists.mockReturnValue(false);
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, photosDropped: 1 });
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });

  it("si la API no devuelve el id del registro, no se puede adjuntar y se descarta la foto", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(201, {}));

    const summary = await flush();

    expect(summary).toMatchObject({ sent: 1, photosDropped: 1 });
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
    expect(files.deletePhoto).toHaveBeenCalledWith("file:///p/a.jpg");
  });

  it("si el registro es rechazado definitivamente, las fotos se conservan hasta que el usuario lo descarte", async () => {
    await withPhoto("a");
    sdk.createFiscalRecord.mockResolvedValue(reply(403, { message: "no" }));

    await flush();

    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
    expect(files.deletePhoto).not.toHaveBeenCalled();

    await outbox.discardItem("a");
    expect(files.deletePhoto).toHaveBeenCalledWith("file:///p/a.jpg");
  });
});
