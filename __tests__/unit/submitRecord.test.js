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
const photo = {
  path: "file:///docs/pending-photos/p.jpg",
  width: 1280,
  height: 960,
};

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

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("submitRecord: sin foto", () => {
  it("enviado en linea: no toca la bandeja", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));

    expect(await submit()).toEqual({ outcome: "sent", photo: "none" });
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

describe("submitRecord: con foto", () => {
  it("registro y foto en linea: sube con el id devuelto y borra el archivo local", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201, { id: 900 }));

    expect(await submit({ photo })).toEqual({
      outcome: "sent",
      photo: "uploaded",
    });
    expect(sdk.uploadAttachment).toHaveBeenCalledWith(
      "tok",
      "REGISTRO",
      55,
      expect.any(Uint8Array),
    );
    expect(files.deletePhoto).toHaveBeenCalledWith(photo.path);
    expect(await outbox.getQueue()).toEqual([]);
  });

  it("las incidencias adjuntan a INCIDENCIA", async () => {
    sdk.createIncidencia.mockResolvedValue(reply(201, { id: 9 }));
    sdk.uploadAttachment.mockResolvedValue(reply(201));

    const result = await submit({
      kind: outbox.KINDS.INCIDENCIA,
      payload: { asociacion_id: 1, tipo: "OTRO", descripcion: "Bloqueo" },
      photo,
    });

    expect(result).toEqual({ outcome: "sent", photo: "uploaded" });
    expect(sdk.createFiscalRecord).not.toHaveBeenCalled();
    expect(sdk.uploadAttachment.mock.calls[0].slice(1, 3)).toEqual([
      "INCIDENCIA",
      9,
    ]);
  });

  it("sin conexion antes de crear: todo (registro y foto) queda en la bandeja", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(0));

    expect(await submit({ photo })).toEqual({ outcome: "queued" });
    const [item] = await outbox.getQueue();
    expect(item.photos).toEqual([{ path: photo.path }]);
    expect(files.deletePhoto).not.toHaveBeenCalled();
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });

  it("el registro se envia pero la foto falla por red: queda en la bandeja y el registro no se pierde", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(reply(0));

    expect(await submit({ photo })).toEqual({ outcome: "photo_queued" });
    const [item] = await outbox.getQueue();
    expect(item).toMatchObject({ id: "req-1", status: "pending" });
    expect(item.photos).toEqual([{ path: photo.path }]);
    expect(files.deletePhoto).not.toHaveBeenCalled();
  });

  it("al reenviar desde la bandeja no se duplica el registro (la API lo reconoce) y se sube la foto", async () => {
    sdk.createFiscalRecord.mockResolvedValueOnce(reply(201, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValueOnce(reply(503));
    await submit({ photo });

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

    expect(await submit({ photo })).toEqual({ outcome: "photo_queued" });
  });

  it("un 409 (ya tenia foto) cuenta como subida", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(200, { id: 55 }));
    sdk.uploadAttachment.mockResolvedValue(
      reply(409, { message: "ya tiene foto" }),
    );

    expect(await submit({ photo })).toEqual({
      outcome: "sent",
      photo: "uploaded",
    });
  });

  it.each([413, 415, 403])(
    "una foto rechazada con %i se descarta; el registro queda enviado",
    async (status) => {
      sdk.createFiscalRecord.mockResolvedValue(reply(201, { id: 55 }));
      sdk.uploadAttachment.mockResolvedValue(reply(status, { message: "no" }));

      expect(await submit({ photo })).toEqual({
        outcome: "sent",
        photo: "rejected",
      });
      expect(files.deletePhoto).toHaveBeenCalledWith(photo.path);
      expect(await outbox.getQueue()).toEqual([]);
    },
  );

  it("si la API no devuelve el id no se puede adjuntar: foto descartada, registro enviado", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(201, {}));

    expect(await submit({ photo })).toEqual({
      outcome: "sent",
      photo: "rejected",
    });
    expect(sdk.uploadAttachment).not.toHaveBeenCalled();
  });

  it("si el registro es rechazado, la foto se conserva para poder reintentar", async () => {
    sdk.createFiscalRecord.mockResolvedValue(reply(400, { message: "mal" }));

    expect(await submit({ photo })).toEqual({
      outcome: "rejected",
      message: "mal",
    });
    expect(files.deletePhoto).not.toHaveBeenCalled();
    expect(await outbox.getQueue()).toEqual([]);
  });
});
