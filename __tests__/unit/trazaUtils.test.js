import {
  buildTrazaCsv,
  extractFiscalOptions,
  filterTraza,
  formatDateTime,
  formatInputDate,
  sumPassengers,
} from "../../src/utils/traza";

const items = [
  {
    id: 1,
    unidad_id: 10,
    fiscal_id: 7,
    fiscal_nombre: "Ana",
    fiscal_apellido: "Pérez",
    placa: "AB123",
    numero_unidad: "010",
    chofer: "Pedro",
    origen: "Caracas",
    destino: "Maracay",
    pasajeros: 20,
    punto_control: "Peaje Norte",
    fecha_hora_registro: "2026-10-18T10:00:00.000Z",
  },
  {
    id: 2,
    unidad_id: 11,
    fiscal_id: 8,
    fiscal_nombre: "Luis",
    placa: "XY999",
    chofer: 'Juan "el flaco"',
    destino: "Valencia",
    pasajeros: "15",
  },
  { id: 3, unidad_id: 10, fiscal_id: 7, fiscal_nombre: "Ana", pasajeros: null },
];

describe("formatInputDate / formatDateTime", () => {
  it("formatea AAAA-MM-DD con ceros", () => {
    expect(formatInputDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatInputDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("fechas vacias o invalidas son 'Sin fecha'", () => {
    expect(formatDateTime(undefined)).toBe("Sin fecha");
    expect(formatDateTime("no-es-fecha")).toBe("Sin fecha");
    expect(formatDateTime("2026-10-18T10:00:00.000Z")).not.toBe("Sin fecha");
  });
});

describe("filterTraza", () => {
  it("sin filtros devuelve todo", () => {
    expect(filterTraza(items)).toHaveLength(3);
  });

  it("filtra por fiscal", () => {
    expect(filterTraza(items, { fiscalId: 8 }).map((i) => i.id)).toEqual([2]);
    expect(filterTraza(items, { fiscalId: "7" }).map((i) => i.id)).toEqual([
      1, 3,
    ]);
  });

  it("filtra por unidad", () => {
    expect(filterTraza(items, { unitId: 10 }).map((i) => i.id)).toEqual([1, 3]);
  });

  it.each([
    ["placa", "xy999", 2],
    ["numero de unidad", "010", 1],
    ["chofer", "pedro", 1],
    ["destino", "valencia", 2],
    ["origen", "caracas", 1],
  ])("busca por %s sin distinguir mayusculas", (_campo, query, id) => {
    expect(filterTraza(items, { query }).map((i) => i.id)).toEqual([id]);
  });

  it("combina los filtros", () => {
    expect(
      filterTraza(items, { fiscalId: 7, unitId: 10, query: "pedro" }).map(
        (i) => i.id,
      ),
    ).toEqual([1]);
    expect(filterTraza(items, { fiscalId: 8, query: "pedro" })).toEqual([]);
  });
});

describe("sumPassengers", () => {
  it("suma numeros y textos numericos; ignora nulos e invalidos", () => {
    expect(sumPassengers(items)).toBe(35);
    expect(sumPassengers([])).toBe(0);
    expect(sumPassengers([{ pasajeros: "abc" }, { pasajeros: 4 }])).toBe(4);
  });
});

describe("extractFiscalOptions", () => {
  it("lista cada fiscal una vez, con id y nombre", () => {
    expect(extractFiscalOptions(items)).toEqual([
      { id: "7", nombre: "Ana" },
      { id: "8", nombre: "Luis" },
    ]);
  });

  it("ignora registros sin fiscal o sin nombre", () => {
    expect(
      extractFiscalOptions([{ fiscal_id: 1 }, { fiscal_nombre: "X" }]),
    ).toEqual([]);
  });
});

describe("buildTrazaCsv", () => {
  it("incluye encabezado y una fila por registro", () => {
    const lines = buildTrazaCsv(items).split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(
      '"Fecha","Unidad","Placa","Fiscal","Punto de control","Chofer","Origen","Destino","Pasajeros"',
    );
  });

  it("encierra todo entre comillas y duplica las comillas internas", () => {
    const row = buildTrazaCsv(items).split("\n")[2];
    expect(row).toContain('"Juan ""el flaco"""');
  });

  it("usa numero de unidad o id, nombre completo del fiscal y vacios para lo ausente", () => {
    const [, first, second, third] = buildTrazaCsv(items).split("\n");
    expect(first).toContain('"010","AB123","Ana Pérez","Peaje Norte","Pedro"');
    expect(second).toContain('"11","XY999","Luis"');
    // Sin placa, punto de control, chofer, origen, destino ni pasajeros: vacios.
    expect(third).toContain('"10","","Ana"');
    expect(third.endsWith(',"Ana","","","","",""')).toBe(true);
  });
});
