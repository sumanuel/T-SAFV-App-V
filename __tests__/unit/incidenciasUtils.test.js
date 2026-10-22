const {
  INCIDENCIA_TIPOS,
  buildIncidenciaPayload,
  countByEstado,
  filterIncidencias,
  getEstado,
  getReporterName,
  getTipoLabel,
  getUnitLabel,
  validateIncidenciaDraft,
} = require("../../src/utils/incidencias");
const { hasPermission } = require("../../src/constants/accessControl");

const items = [
  {
    id: 1,
    tipo: "ACCIDENTE",
    estado: "ABIERTA",
    descripcion: "Choque leve en la rotonda",
    lugar: "Rotonda Norte",
    numero_unidad: "12",
    placa: "ABC123",
    reportada_por_nombre: "Ana",
    reportada_por_apellido: "Pérez",
  },
  {
    id: 2,
    tipo: "INFRACCION",
    estado: "CERRADA",
    descripcion: "Exceso de pasajeros",
    numero_unidad: "7",
    placa: "XYZ987",
  },
  { id: 3, tipo: "OTRO", estado: "EN_REVISION", descripcion: "Bloqueo de vía" },
];

describe("catalogo", () => {
  it("coincide con los tipos que acepta la API", () => {
    expect(INCIDENCIA_TIPOS.map((tipo) => tipo.value)).toEqual([
      "INFRACCION",
      "ACCIDENTE",
      "FALLA_MECANICA",
      "CONDUCTA_CHOFER",
      "OTRO",
    ]);
  });

  it("etiquetas con valor por defecto para datos desconocidos", () => {
    expect(getTipoLabel("FALLA_MECANICA")).toBe("Falla mecánica");
    expect(getTipoLabel("RARO")).toBe("Otro");
    expect(getEstado("CERRADA").label).toBe("Cerrada");
    expect(getEstado("???").value).toBe("ABIERTA");
  });
});

describe("validateIncidenciaDraft", () => {
  const ok = { tipo: "OTRO", descripcion: "Algo paso", lugar: "" };

  it("acepta un borrador valido", () => {
    expect(validateIncidenciaDraft(ok)).toBeNull();
  });

  it.each([
    [{ ...ok, tipo: "" }, /tipo/],
    [{ ...ok, tipo: "NOPE" }, /tipo/],
    [{ ...ok, descripcion: "  a " }, /mínimo 3/],
    [{ ...ok, descripcion: "x".repeat(4001) }, /4000/],
    [{ ...ok, lugar: "y".repeat(256) }, /255/],
  ])("rechaza %j", (draft, message) => {
    expect(validateIncidenciaDraft(draft)).toMatch(message);
  });
});

describe("buildIncidenciaPayload", () => {
  it("normaliza y omite lo opcional vacio", () => {
    expect(
      buildIncidenciaPayload({
        asociacionId: "4",
        unidadId: "",
        tipo: "OTRO",
        descripcion: "  Bloqueo  ",
        lugar: "   ",
      }),
    ).toEqual({ asociacion_id: 4, tipo: "OTRO", descripcion: "Bloqueo" });
  });

  it("incluye unidad y lugar cuando existen", () => {
    expect(
      buildIncidenciaPayload({
        asociacionId: 4,
        unidadId: "9",
        tipo: "ACCIDENTE",
        descripcion: "Choque",
        lugar: " Av. 5 ",
      }),
    ).toEqual({
      asociacion_id: 4,
      unidad_id: 9,
      tipo: "ACCIDENTE",
      descripcion: "Choque",
      lugar: "Av. 5",
    });
  });
});

describe("filtros", () => {
  it("por estado", () => {
    expect(
      filterIncidencias(items, { estado: "CERRADA" }).map((item) => item.id),
    ).toEqual([2]);
    expect(filterIncidencias(items, { estado: "TODAS" })).toHaveLength(3);
  });

  it("por texto en descripcion, lugar, unidad, placa, tipo y reportante", () => {
    const ids = (query) =>
      filterIncidencias(items, { query }).map((item) => item.id);
    expect(ids("rotonda")).toEqual([1]);
    expect(ids("abc123")).toEqual([1]);
    expect(ids("infracción")).toEqual([2]);
    expect(ids("pérez")).toEqual([1]);
    expect(ids("bloqueo")).toEqual([3]);
    expect(ids("zzz")).toEqual([]);
  });

  it("combina estado y texto, y tolera listas vacias", () => {
    expect(
      filterIncidencias(items, { estado: "ABIERTA", query: "exceso" }),
    ).toEqual([]);
    expect(filterIncidencias(undefined)).toEqual([]);
  });

  it("cuenta por estado", () => {
    expect(countByEstado(items)).toEqual({
      TODAS: 3,
      ABIERTA: 1,
      EN_REVISION: 1,
      CERRADA: 1,
    });
  });
});

describe("etiquetas", () => {
  it("unidad y reportante", () => {
    expect(getUnitLabel(items[0])).toBe("U-12 · ABC123");
    expect(getUnitLabel({ placa: "Q1" })).toBe("Q1");
    expect(getUnitLabel({})).toBe("Sin unidad");
    expect(getReporterName(items[0])).toBe("Ana Pérez");
    expect(getReporterName({})).toBe("Sin dato");
  });
});

describe("permisos", () => {
  it("todos ven; fiscales y administradores registran; solo el administrador gestiona", () => {
    for (const role of ["owner", "fiscal", "administrator"]) {
      expect(hasPermission(role, "incidents.view")).toBe(true);
    }
    expect(hasPermission("owner", "incidents.create")).toBe(false);
    expect(hasPermission("fiscal", "incidents.create")).toBe(true);
    expect(hasPermission("administrator", "incidents.create")).toBe(true);
    expect(hasPermission("fiscal", "incidents.manage")).toBe(false);
    expect(hasPermission("administrator", "incidents.manage")).toBe(true);
  });
});
