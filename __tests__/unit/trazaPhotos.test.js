const {
  SUMMARY_CHUNK_SIZE,
  buildPhotoMap,
  chunkRecordIds,
} = require("../../src/utils/trazaPhotos");

describe("chunkRecordIds", () => {
  it("devuelve ids unicos como texto, ignorando registros sin id", () => {
    const items = [
      { id: 1 },
      { id: "2" },
      { id: 1 },
      { id: null },
      {},
      null,
      { id: 0 },
    ];

    expect(chunkRecordIds(items)).toEqual([["1", "2", "0"]]);
  });

  it("parte en bloques del tamano que acepta la API (200)", () => {
    expect(SUMMARY_CHUNK_SIZE).toBe(200);
    const items = Array.from({ length: 450 }, (_, index) => ({
      id: index + 1,
    }));

    const chunks = chunkRecordIds(items);

    expect(chunks.map((chunk) => chunk.length)).toEqual([200, 200, 50]);
    expect(chunks[2][49]).toBe("450");
  });

  it("sin registros no hay nada que consultar", () => {
    expect(chunkRecordIds([])).toEqual([]);
    expect(chunkRecordIds(undefined)).toEqual([]);
  });
});

describe("buildPhotoMap", () => {
  it("relaciona cada fiscalizacion con el id de su foto", () => {
    expect(
      buildPhotoMap([
        { entidad_id: 10, adjunto_id: 500 },
        { entidad_id: "11", adjunto_id: "501" },
      ]),
    ).toEqual({ 10: "500", 11: "501" });
  });

  it("descarta filas incompletas y tolera entradas invalidas", () => {
    expect(
      buildPhotoMap([
        { entidad_id: 10 },
        { adjunto_id: 5 },
        null,
        { entidad_id: 12, adjunto_id: 0 },
      ]),
    ).toEqual({ 12: "0" });
    expect(buildPhotoMap(undefined)).toEqual({});
  });
});
