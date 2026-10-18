import {
  buildVehicleDraft,
  buildVehiclePayload,
  validateVehicleSubmission,
} from "../../src/utils/vehicleForm";

describe("buildVehicleDraft", () => {
  it("sin unidad devuelve todos los campos vacios", () => {
    const draft = buildVehicleDraft(undefined);
    expect(Object.values(draft).every((v) => v === "")).toBe(true);
    expect(Object.keys(draft)).toHaveLength(15);
  });

  it("convierte numeros a texto y recorta la fecha a AAAA-MM-DD", () => {
    const draft = buildVehicleDraft({
      placa: "AB123",
      ano: 2020,
      numero_cilindros: 4,
      numero_unidad: 10,
      numero_puestos: 30,
      fecha_emision: "2024-01-15T00:00:00.000Z",
      chofer: "Pedro",
    });

    expect(draft).toMatchObject({
      placa: "AB123",
      ano: "2020",
      numero_cilindros: "4",
      numero_unidad: "10",
      numero_puestos: "30",
      fecha_emision: "2024-01-15",
      chofer: "Pedro",
    });
  });

  it("un cero numerico queda vacio (como antes: se trata como sin dato)", () => {
    expect(buildVehicleDraft({ ano: 0, numero_puestos: 0 })).toMatchObject({
      ano: "",
      numero_puestos: "",
    });
  });
});

describe("validateVehicleSubmission", () => {
  const draft = { ...buildVehicleDraft(), placa: "AB1", numero_unidad: "010" };
  const ok = {
    draft,
    isOwnerSelfService: false,
    isEditing: false,
    propietarioId: 5,
    asociacionId: 1,
  };

  it("acepta un envio completo", () => {
    expect(validateVehicleSubmission(ok)).toBeNull();
  });

  it("el propietario (autoservicio) solo puede editar, no crear", () => {
    expect(
      validateVehicleSubmission({ ...ok, isOwnerSelfService: true })?.title,
    ).toBe("Unidades");
    expect(
      validateVehicleSubmission({
        ...ok,
        isOwnerSelfService: true,
        isEditing: true,
      }),
    ).toBeNull();
  });

  it("exige placa y numero de unidad", () => {
    for (const field of ["placa", "numero_unidad"]) {
      expect(
        validateVehicleSubmission({
          ...ok,
          draft: { ...draft, [field]: "  " },
        })?.title,
      ).toBe("Datos incompletos");
    }
  });

  it("exige propietario y asociacion", () => {
    expect(
      validateVehicleSubmission({ ...ok, propietarioId: null })?.title,
    ).toBe("Sin propietario");
    expect(
      validateVehicleSubmission({ ...ok, asociacionId: undefined })?.title,
    ).toBe("Sin asociacion");
  });
});

describe("buildVehiclePayload", () => {
  it("recorta textos, pone la placa en mayusculas y convierte numeros", () => {
    const payload = buildVehiclePayload(
      {
        ...buildVehicleDraft(),
        placa: " ab-123 ",
        numero_unidad: " 010 ",
        marca: " Toyota ",
        ano: "2020",
        numero_cilindros: "4",
        numero_puestos: "30",
        fecha_emision: " 2024-01-15 ",
      },
      "7",
    );

    expect(payload).toMatchObject({
      propietario_id: 7,
      placa: "AB-123",
      numero_unidad: "010",
      marca: "Toyota",
      ano: 2020,
      numero_cilindros: 4,
      numero_puestos: 30,
      fecha_emision: "2024-01-15",
    });
  });

  it("los numeros y la fecha vacios se omiten (undefined)", () => {
    const payload = buildVehiclePayload(
      { ...buildVehicleDraft(), placa: "A", numero_unidad: "1" },
      1,
    );

    expect(payload.ano).toBeUndefined();
    expect(payload.numero_cilindros).toBeUndefined();
    expect(payload.numero_puestos).toBeUndefined();
    expect(payload.fecha_emision).toBeUndefined();
    expect(payload.marca).toBe("");
  });
});
