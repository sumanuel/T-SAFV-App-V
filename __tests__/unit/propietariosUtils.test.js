import {
  describeUnit,
  filterPropietarios,
  getFullName,
  getMembershipId,
  getUserId,
  mergeLinkedUnits,
} from "../../src/utils/propietarios";

describe("identificadores", () => {
  it("devuelven cadena vacia cuando no hay dato", () => {
    expect(getMembershipId(undefined)).toBe("");
    expect(getMembershipId({})).toBe("");
    expect(getUserId(null)).toBe("");
    expect(getMembershipId({ membresia_id: 7 })).toBe(7);
    expect(getUserId({ id: 3 })).toBe(3);
  });
});

describe("getFullName / describeUnit", () => {
  it("une solo las partes presentes", () => {
    expect(getFullName({ nombre: "Ana", apellido: "Pérez" })).toBe("Ana Pérez");
    expect(getFullName({ nombre: "Ana" })).toBe("Ana");
    expect(getFullName({})).toBe("");
    expect(getFullName(undefined)).toBe("");
  });

  it("describe la unidad o usa el texto por defecto", () => {
    expect(
      describeUnit({ marca: "Toyota", modelo: "Coaster", ano: 2018 }),
    ).toBe("Toyota Coaster 2018");
    expect(describeUnit({ marca: "Toyota" })).toBe("Toyota");
    expect(describeUnit({})).toBe("Unidad sin descripción");
    expect(describeUnit(undefined)).toBe("Unidad sin descripción");
  });
});

describe("mergeLinkedUnits", () => {
  it("combina las unidades del propietario con las de la asociacion", () => {
    const owner = {
      id: 5,
      linked_units: [{ id: 1, placa: "AAA", numero_unidad: "010" }],
    };
    const all = [
      { id: 1, propietario_id: 5, placa: "AAA", color: "rojo" },
      { id: 2, propietario_id: 5, placa: "BBB", numero_unidad: "011" },
      { id: 3, propietario_id: 9, placa: "CCC" },
    ];

    const result = mergeLinkedUnits(owner, all);

    expect(result.map((u) => u.id)).toEqual([1, 2]);
    expect(result[0]).toEqual({
      id: 1,
      propietario_id: 5,
      placa: "AAA",
      numero_unidad: "010",
      color: "rojo",
    });
  });

  it("ordena por numero de unidad de forma numerica", () => {
    const owner = { id: 5 };
    const all = [
      { id: 1, propietario_id: 5, numero_unidad: "10" },
      { id: 2, propietario_id: 5, numero_unidad: "2" },
      { id: 3, propietario_id: 5, numero_unidad: "1" },
    ];

    expect(mergeLinkedUnits(owner, all).map((u) => u.numero_unidad)).toEqual([
      "1",
      "2",
      "10",
    ]);
  });

  it("tolera datos ausentes", () => {
    expect(mergeLinkedUnits(undefined, undefined)).toEqual([]);
    expect(
      mergeLinkedUnits({ id: 1, linked_units: "no-es-lista" }, []),
    ).toEqual([]);
  });

  it("las unidades sin id se distinguen por numero o placa", () => {
    const owner = {
      id: 5,
      linked_units: [
        { numero_unidad: "001" },
        { placa: "ZZZ" },
        { numero_unidad: "001", color: "azul" },
      ],
    };

    expect(mergeLinkedUnits(owner, [])).toHaveLength(2);
  });
});

describe("filterPropietarios", () => {
  const owners = [
    {
      id: 1,
      nombre: "Ana",
      apellido: "Pérez",
      rif_cedula: "V-123",
      email: "ana@x.com",
      telefono: "0414",
      linked_units: [{ placa: "AB123", numero_unidad: "010" }],
    },
    { id: 2, nombre: "Luis", rif_cedula: "V-999" },
  ];

  it("sin texto devuelve la lista completa", () => {
    expect(filterPropietarios(owners, "")).toBe(owners);
    expect(filterPropietarios(owners, "  ")).toBe(owners);
  });

  it.each([
    ["cedula", "v-123", 1],
    ["nombre", "luis", 2],
    ["apellido", "pérez", 1],
    ["correo", "ana@x", 1],
    ["telefono", "0414", 1],
    ["placa de una unidad", "ab123", 1],
    ["numero de una unidad", "010", 1],
  ])("busca por %s", (_campo, query, id) => {
    expect(filterPropietarios(owners, query).map((o) => o.id)).toEqual([id]);
  });

  it("no encuentra nada con un texto que no coincide", () => {
    expect(filterPropietarios(owners, "zzz")).toEqual([]);
  });
});
