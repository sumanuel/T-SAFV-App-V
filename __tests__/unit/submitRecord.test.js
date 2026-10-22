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
  readPhotoBytes: jest.fn(async () => new Uint8Array([1, 2, 3])),
  deletePhoto: jest.fn(),
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");
const sdk = require("../../src/services/api/sdk").default;
const files = require("../../src/services/media/photoFiles");
const outbox = require("../../src/services/offline/outbox");
const { submitRecord } = require("../../src/services/offline/submitRecord");

const reply = (status, data = {}) => ({ status, data });
const WHEN = "2026-10-18T10:00:00.000Z";
const photo = (name) => ({
  path: `file:///docs/pending-photos/${name}.jpg`,
  width: 1280,
  height: 960,
});
const [p1, p2, p3] = [photo("p1"), photo("p2"), photo("p3")];

const submit = (overrides = {}) =>
  submitRecord({
    kind: outbox.KINDS.FISCALIZACION,
    token: "tok",
    userId: 7,
    id: "req-1",
    payload: { unidad_id: 3, asociacion_id: 1 },
    capturedAt: WHEN,
    ...overrides,
  });

const sent = (photosUploaded = 0, photosRejected = 0) => ({
  outcome: "sent",
  photosUploaded,
  photosRejected,
});

beforeEach(async () => {
  jest.clearAllMocks();
  files.photoExists.mockReturnValue(true);
  await AsyncStorage.clear();
});

describe("submitRecord: sin fotos", () => {
  it("enviado en linea: no toca la bandeja", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));

    expect(await submit()).toEqual(sent());
    expect(sdk.createFiscalRecord).toHaveBeenCalledWith("tok", {
      unidad_id: 3,
      asociacion_id: 1,
      client_request_id: "req-1",
      fecha_hora_registro: WHEN,
    });
    expect(await outbox.getQueue()).toEqual([]);
  });

  it.each([0, 500, 401, 429])("con %i queda en la bandeja", async (status) => {
    sdk.createFiscalRecord.mockResolvedValue(reply(status));

    expect(await submit()).toEqual({ outcome: "queued" });
    const [item] = await outbox.getQueue();
    expect(item).toMatchObject({
      id: "req-1",
      kind: "fiscalizacion",
      userId: "7",
      capturedAt: WHEN,
    });
  });

  it("un rechazo del servidor se devuelve con su mensaje y NO se encola", async () => {
    sdk.createFiscalRecord.mockResolvedValue(
      reply(400, { errors: [{ msg: "unidad_id must be integer" }] }),
    );

    expect(await submit()).toEqual({
      outcome: "rejected",
      message: "unidad_id must be integer",
    });
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("usa el mensaje por defecto si el servidor no explica el rechazo", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(403));

    expect(
      await submit({ fallbackMessage: "No se pudo guardar la fiscalización." }),
    ).toEqual({
      outcome: "rejected",
      message: "No se pudo guardar la fiscalización.",
    });
  });
});

describe("submitRecord: con una foto", () => {
  it("registro y foto en linea: sube con el id devuelto y borra el archivo local", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201, { id: 900 }));

    expect(await submit({ photos: [p1] })).toEqual(sent(1));
    expect(sdk.uploadAttachment).toHaveBeenCalledWith(
      "tok",
      "REGISTRO",
      55,
      expect.any(Uint8Array),
    );
    expect(files.deletePhoto).toHaveBeenCalledWith(p1.path);
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("sin conexion antes de crear: todo (registro y foto) queda en la bandeja", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(0));

    expect(await submit({ photos: [p1] })).toEqual({ outcome: "queued" });
    const [item] = await outbox.getQueue();
    expect(item.photos).toEqual([{ path: p1.path }]);
    expect(files.deletePhoto).not.toHaveBeenCalled();
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });

  it("el registro se envia pero la foto falla por red: queda en la bandeja y el registro no se pierde", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(reply(0));

    expect(await submit({ photos: [p1] })).toEqual({
      outcome: "photo_queued",
      photosUploaded: 0,
      photosRejected: 0,
      photosQueued: 1,
    });
    const [item] = await outbox.getQueue();
    expect(item).toMatchObject({ id: "req-1", status: "pending" });
    expect(item.photos).toEqual([{ path: p1.path }]);
    expect(files.deletePhoto).not.toHaveBeenCalled();
  });

  it("al reenviar desde la bandeja no se duplica el registro (la API lo reconoce) y se sube la foto", async () => {
    sdk.createFiscalRecord.mockResolvedValueOnce(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValueOnce(reply(503));
    await submit({ photos: [p1] });

    sdk.createFiscalRecord.mockResolvedValue(reply(200, { id: 55 })); // idempotente
    sdk.uploadAttachment.mockResolvedValue(reply(201));
    const summary = await outbox.flushOutbox({ token: "tok", userId: 7 });

    expect(summary).toMatchObject({ sent: 1, photosDropped: 0 });
    expect(sdk.createFiscalRecord.mock.calls[1][1].client_request_id).toBe(
      "req-1",
    );
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("con la API sin actualizar (404 sin cuerpo) la foto va a la bandeja en vez de perderse", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue({ status: 404, data: null });

    expect((await submit({ photos: [p1] })).outcome).toBe("photo_queued");
  });

  it("un 409 (ya tenia foto) cuenta como subida", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(200, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(
      reply(409, { message: "ya tiene foto" }),
    );

    expect(await submit({ photos: [p1] })).toEqual(sent(1));
  });

  it.each([413, 415, 403])(
    "una foto rechazada con %i se descarta; el registro queda enviado",
    async (status) => {
      sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
      sdk.uploadAttachment.mockResolvedValue(reply(status, { message: "no" }));

      expect(await submit({ photos: [p1] })).toEqual(sent(0, 1));
      expect(files.deletePhoto).toHaveBeenCalledWith(p1.path);
      expect(await outbox.getQueue()).toEqual([]);
    },
  );

  it("si la API no devuelve el id no se puede adjuntar: fotos descartadas, registro enviado", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, {}));

    expect(await submit({ photos: [p1, p2] })).toEqual(sent(0, 2));
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
    expect(files.deletePhoto).toHaveBeenCalledTimes(2);
  });

  it("si el registro es rechazado, las fotos se conservan para poder reintentar", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(400, { message: "mal" }));

    expect(await submit({ photos: [p1] })).toEqual({
      outcome: "rejected",
      message: "mal",
    });
    expect(files.deletePhoto).not.toHaveBeenCalled();
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("una foto cuyo archivo ya no existe se cuenta como rechazada sin llamar a la API", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    files.photoExists.mockReturnValue(false);

    expect(await submit({ photos: [p1] })).toEqual(sent(0, 1));
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });
});

describe("submitRecord: incidencias con varias fotos", () => {
  const incidencia = (overrides = {}) =>
    submit({
      kind: outbox.KINDS.INCIDENCIA,
      payload: { asociacion_id: 1, tipo: "OTRO", descripcion: "Bloqueo" },
      ...overrides,
    });

  it("crea la incidencia y sube las tres fotos a INCIDENCIA", async () => {
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201));

    expect(await incidencia({ photos: [p1, p2, p3] })).toEqual(sent(3));
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
    expect(sdk.createIncidencia).toHaveBeenCalledWith("tok", {
      asociacion_id: 1,
      tipo: "OTRO",
      descripcion: "Bloqueo",
      client_request_id: "req-1",
      fecha_hora_evento: WHEN,
    });
    expect(
      sdk.uploadAttachment.mock.calls.map((call) => call.slice(1, 3)),
    ).toEqual([
      ["INCIDENCIA", 9],
      ["INCIDENCIA", 9],
      ["INCIDENCIA", 9],
    ]);
    expect(files.deletePhoto).toHaveBeenCalledTimes(3);
  });

  it("si la segunda foto falla por red, solo las pendientes pasan a la bandeja (la primera no se repite)", async () => {
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));
    sdk.uploadAttachment
      .mockResolvedValueOnce(reply(201))
      .mockResolvedValueOnce(reply(0));

    expect(await incidencia({ photos: [p1, p2, p3] })).toEqual({
      outcome: "photo_queued",
      photosUploaded: 1,
      photosRejected: 0,
      photosQueued: 2,
    });
    expect(sdk.uploadAttachment).toHaveBeenCalledTimes(2); // la tercera no se intenta
    const [item] = await outbox.getQueue();
    expect(item.kind).toBe("incidencia");
    expect(item.photos).toEqual([{ path: p2.path }, { path: p3.path }]);
    expect(files.deletePhoto).toHaveBeenCalledWith(p1.path);
    expect(files.deletePhoto).not.toHaveBeenCalledWith(p2.path);
  });

  it("una foto rechazada no impide subir las demas", async () => {
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));
    sdk.uploadAttachment
      .mockResolvedValueOnce(reply(415, { message: "formato" }))
      .mockResolvedValueOnce(reply(201));

    expect(await incidencia({ photos: [p1, p2] })).toEqual(sent(1, 1));
  });

  it("sin conexion todas las fotos quedan en la bandeja junto a la incidencia", async () => {
    sdk.createIncidencia.mockResolvedValue(reply(0));

    expect(await incidencia({ photos: [p1, p2] })).toEqual({
      outcome: "queued",
    });
    const [item] = await outbox.getQueue();
    expect(item.photos).toHaveLength(2);
  });
});
