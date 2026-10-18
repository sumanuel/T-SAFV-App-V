import {
  EMPTY_ASSOCIATION_DRAFT,
  buildAssociationPayload,
  hasRequiredAssociationFields,
  parseSocialLinks,
} from "../../src/utils/associationDraft";
import { filterUnits } from "../../src/utils/unitFilters";

const units = [
  {
    id: 1,
    placa: "AB123CD",
    numero_unidad: "010",
    marca: "Toyota",
    modelo: "Coaster",
    chofer: "Pedro Pérez",
    propietario_nombre: "Ana",
  },
  {
    id: 2,
    placa: "XY999ZZ",
    numero_unidad: "011",
    marca: "Yutong",
    modelo: "ZK6",
    chofer: "Luis Gómez",
    propietario_nombre: "Carlos",
  },
  { id: 3, placa: null, numero_unidad: null },
];

describe("filterUnits", () => {
  it("sin texto devuelve todas las unidades", () => {
    expect(filterUnits(units, "")).toBe(units);
    expect(filterUnits(units, "   ")).toBe(units);
    expect(filterUnits(units, undefined)).toBe(units);
  });

  it.each([
    ["placa", "ab123", 1],
    ["numero de unidad", "011", 2],
    ["marca", "toyota", 1],
    ["modelo", "zk6", 2],
    ["chofer", "gómez", 2],
    ["propietario", "ana", 1],
  ])("busca por %s sin distinguir mayusculas", (_campo, query, id) => {
    expect(filterUnits(units, query).map((u) => u.id)).toEqual([id]);
  });

  it("ignora espacios alrededor y tolera campos nulos", () => {
    expect(filterUnits(units, "  yutong  ").map((u) => u.id)).toEqual([2]);
    expect(filterUnits(units, "nada").length).toBe(0);
  });
});

describe("associationDraft", () => {
  const full = {
    ...EMPTY_ASSOCIATION_DRAFT,
    nombre: "Asoc Norte",
    rif: "J-1",
    direccion_fiscal: "Calle 1",
    email: "a@b.c",
    telefonos: "0414",
  };

  it("exige nombre, RIF, direccion, correo y telefonos", () => {
    expect(hasRequiredAssociationFields(EMPTY_ASSOCIATION_DRAFT)).toBe(false);
    expect(hasRequiredAssociationFields(full)).toBe(true);
    for (const field of [
      "nombre",
      "rif",
      "direccion_fiscal",
      "email",
      "telefonos",
    ]) {
      expect(hasRequiredAssociationFields({ ...full, [field]: "   " })).toBe(
        false,
      );
    }
  });

  it("logo y redes sociales son opcionales", () => {
    expect(
      hasRequiredAssociationFields({
        ...full,
        logo_url: "",
        redes_sociales: "",
      }),
    ).toBe(true);
  });

  describe("parseSocialLinks", () => {
    it("vacio significa sin redes", () => {
      expect(parseSocialLinks("")).toEqual({ ok: true, value: undefined });
      expect(parseSocialLinks("   ")).toEqual({ ok: true, value: undefined });
      expect(parseSocialLinks(undefined)).toEqual({
        ok: true,
        value: undefined,
      });
    });

    it("acepta JSON valido", () => {
      expect(parseSocialLinks('{"instagram":"@asoc"}')).toEqual({
        ok: true,
        value: { instagram: "@asoc" },
      });
    });

    it("rechaza texto que no es JSON", () => {
      expect(parseSocialLinks("@asoc")).toEqual({ ok: false });
      expect(parseSocialLinks("{instagram: asoc}")).toEqual({ ok: false });
    });
  });

  it("buildAssociationPayload arma el cuerpo que espera la API", () => {
    expect(buildAssociationPayload(full, { instagram: "@asoc" })).toEqual({
      nombre: "Asoc Norte",
      rif: "J-1",
      direccion_fiscal: "Calle 1",
      email: "a@b.c",
      telefonos: "0414",
      logo_url: "",
      redes_sociales: { instagram: "@asoc" },
    });
  });
});
