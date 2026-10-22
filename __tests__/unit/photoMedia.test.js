const mockManipulator = {
  resize: jest.fn(),
  renderAsync: jest.fn(),
};
const mockSaved = { uri: "file:///cache/out.jpg", width: 1280, height: 960 };

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: jest.fn(() => mockManipulator) },
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("../../src/services/media/photoFiles", () => ({
  persistPhoto: jest.fn(
    async (_uri, id) => `file:///docs/pending-photos/${id}.jpg`,
  ),
}));

const { ImageManipulator } = require("expo-image-manipulator");
const ImagePicker = require("expo-image-picker");
const { persistPhoto } = require("../../src/services/media/photoFiles");
const { preparePhoto } = require("../../src/services/media/photoPipeline");
const {
  capturePhoto,
  choosePhoto,
} = require("../../src/services/media/photoPicker");
const {
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_SIDE,
  computeResize,
} = require("../../src/utils/photoSizing");

beforeEach(() => {
  jest.clearAllMocks();
  mockManipulator.renderAsync.mockResolvedValue({
    saveAsync: jest.fn(async () => mockSaved),
  });
});

describe("computeResize", () => {
  it("reduce solo el lado mayor, conservando la proporcion", () => {
    expect(computeResize(4000, 3000)).toEqual({ width: PHOTO_MAX_SIDE });
    expect(computeResize(3000, 4000)).toEqual({ height: PHOTO_MAX_SIDE });
    expect(computeResize(4000, 4000)).toEqual({ width: PHOTO_MAX_SIDE });
  });

  it("no toca una imagen que ya es chica", () => {
    expect(computeResize(1280, 720)).toBeNull();
    expect(computeResize(800, 600)).toBeNull();
  });

  it("sin dimensiones conocidas no redimensiona", () => {
    expect(computeResize(undefined, undefined)).toBeNull();
    expect(computeResize(0, 0)).toBeNull();
  });
});

describe("preparePhoto", () => {
  it("redimensiona una foto grande, comprime a JPEG 0,6 y la guarda de forma permanente", async () => {
    const result = await preparePhoto(
      { uri: "file:///cache/camera.jpg", width: 4000, height: 3000 },
      "abc",
    );

    expect(ImageManipulator.manipulate).toHaveBeenCalledWith(
      "file:///cache/camera.jpg",
    );
    expect(mockManipulator.resize).toHaveBeenCalledWith({ width: 1280 });
    const rendered = await mockManipulator.renderAsync.mock.results[0].value;
    expect(rendered.saveAsync).toHaveBeenCalledWith({
      compress: PHOTO_JPEG_QUALITY,
      format: "jpeg",
    });
    expect(persistPhoto).toHaveBeenCalledWith("file:///cache/out.jpg", "abc");
    expect(result).toEqual({
      path: "file:///docs/pending-photos/abc.jpg",
      width: 1280,
      height: 960,
    });
  });

  it("no redimensiona una foto que ya es chica (solo comprime)", async () => {
    await preparePhoto({ uri: "file:///g.jpg", width: 800, height: 600 }, "x");
    expect(mockManipulator.resize).not.toHaveBeenCalled();
  });
});

describe("photoPicker", () => {
  const granted = { granted: true };
  const denied = { granted: false };
  const picked = {
    canceled: false,
    assets: [{ uri: "file:///a.jpg", width: 10, height: 20, extra: 1 }],
  };

  it("capturePhoto devuelve uri y dimensiones", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue(granted);
    ImagePicker.launchCameraAsync.mockResolvedValue(picked);

    expect(await capturePhoto()).toEqual({
      uri: "file:///a.jpg",
      width: 10,
      height: 20,
    });
    expect(ImagePicker.launchCameraAsync.mock.calls[0][0]).toMatchObject({
      mediaTypes: ["images"],
      exif: false,
    });
  });

  it("choosePhoto abre la galeria", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue(picked);

    expect((await choosePhoto()).uri).toBe("file:///a.jpg");
  });

  it("devuelve null si el usuario cancela", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue(granted);
    ImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    });
    expect(await capturePhoto()).toBeNull();

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [],
    });
    expect(await choosePhoto()).toBeNull();
  });

  it("sin permiso lanza un mensaje legible y no abre nada", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue(denied);
    await expect(capturePhoto()).rejects.toThrow("cámara");
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(denied);
    await expect(choosePhoto()).rejects.toThrow("galería");
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });
});
