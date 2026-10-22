const mockStore = new Map();
const mockDirs = new Set();

jest.mock("expo-file-system", () => {
  class File {
    constructor(...parts) {
      this.uri = parts
        .map((part) => (typeof part === "string" ? part : part.uri))
        .join("/")
        .replace(/\/{2,}/g, "/")
        .replace("file:/", "file:///");
    }
    get exists() {
      return mockStore.has(this.uri);
    }
    async copy(destination) {
      if (!mockStore.has(this.uri)) throw new Error("origen inexistente");
      mockStore.set(destination.uri, mockStore.get(this.uri));
    }
    delete() {
      mockStore.delete(this.uri);
    }
    async bytes() {
      return mockStore.get(this.uri);
    }
  }
  class Directory {
    constructor(...parts) {
      this.uri = parts
        .map((part) => (typeof part === "string" ? part : part.uri))
        .join("/")
        .replace(/\/{2,}/g, "/")
        .replace("file:/", "file:///");
    }
    get exists() {
      return mockDirs.has(this.uri);
    }
    create() {
      mockDirs.add(this.uri);
    }
  }
  return {
    File,
    Directory,
    Paths: { document: new Directory("file:///docs") },
  };
});

const {
  deletePhoto,
  persistPhoto,
  photoExists,
  readPhotoBytes,
} = require("../../src/services/media/photoFiles");

beforeEach(() => {
  mockStore.clear();
  mockDirs.clear();
});

describe("photoFiles", () => {
  it("persistPhoto copia la foto al directorio de pendientes (creandolo si falta)", async () => {
    mockStore.set("file:///cache/out.jpg", new Uint8Array([1, 2, 3]));

    const path = await persistPhoto("file:///cache/out.jpg", "abc");

    expect(path).toBe("file:///docs/pending-photos/abc.jpg");
    expect(mockDirs.has("file:///docs/pending-photos")).toBe(true);
    expect(mockStore.get(path)).toEqual(new Uint8Array([1, 2, 3]));
    // El original (cache) no se mueve: el sistema puede limpiarlo cuando quiera.
    expect(mockStore.has("file:///cache/out.jpg")).toBe(true);
  });

  it("no vuelve a crear el directorio si ya existe", async () => {
    mockDirs.add("file:///docs/pending-photos");
    mockStore.set("file:///cache/a.jpg", new Uint8Array([9]));

    await expect(persistPhoto("file:///cache/a.jpg", "x")).resolves.toContain(
      "x.jpg",
    );
  });

  it("photoExists y readPhotoBytes reflejan el archivo", async () => {
    mockStore.set("file:///docs/pending-photos/a.jpg", new Uint8Array([7, 8]));

    expect(photoExists("file:///docs/pending-photos/a.jpg")).toBe(true);
    expect(photoExists("file:///docs/pending-photos/nada.jpg")).toBe(false);
    expect(await readPhotoBytes("file:///docs/pending-photos/a.jpg")).toEqual(
      new Uint8Array([7, 8]),
    );
  });

  it("deletePhoto borra el archivo y nunca lanza (ni si no existe)", () => {
    mockStore.set("file:///docs/pending-photos/a.jpg", new Uint8Array([1]));

    deletePhoto("file:///docs/pending-photos/a.jpg");
    expect(photoExists("file:///docs/pending-photos/a.jpg")).toBe(false);

    expect(() =>
      deletePhoto("file:///docs/pending-photos/a.jpg"),
    ).not.toThrow();
  });
});
