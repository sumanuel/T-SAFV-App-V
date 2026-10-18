import {
  buildAssociationForm,
  buildAssociationUpdatePayload,
  getLogoPreview,
} from "../../src/utils/associationForm";

describe("buildAssociationForm", () => {
  it("sin asociacion devuelve todos los campos vacios", () => {
    const form = buildAssociationForm(undefined);
    expect(Object.values(form).every((v) => v === "")).toBe(true);
  });

  it("copia los datos y muestra las redes sociales como JSON indentado", () => {
    const form = buildAssociationForm({
      nombre: "Asoc",
      rif: "J-1",
      telefonos: "0414",
      redes_sociales: { instagram: "@asoc" },
    });

    expect(form.nombre).toBe("Asoc");
    expect(form.telefonos).toBe("0414");
    expect(JSON.parse(form.redes_sociales)).toEqual({ instagram: "@asoc" });
    expect(form.redes_sociales).toContain("\n");
  });
});

describe("buildAssociationUpdatePayload", () => {
  it("envia el formulario tal cual mas las redes ya parseadas", () => {
    const form = {
      ...buildAssociationForm({ nombre: "Asoc", rif: "J-1" }),
      logo_data: "data:image/png;base64,AAA",
    };

    expect(buildAssociationUpdatePayload(form, { x: 1 })).toEqual({
      nombre: "Asoc",
      rif: "J-1",
      direccion_fiscal: "",
      email: "",
      telefonos: "",
      logo_url: "",
      logo_data: "data:image/png;base64,AAA",
      redes_sociales: { x: 1 },
    });
  });
});

describe("getLogoPreview", () => {
  it("la imagen subida tiene prioridad sobre la URL", () => {
    expect(getLogoPreview({ logo_data: "data:x", logo_url: "http://a" })).toBe(
      "data:x",
    );
    expect(getLogoPreview({ logo_data: "  ", logo_url: " http://a " })).toBe(
      "http://a",
    );
    expect(getLogoPreview({ logo_data: "", logo_url: "" })).toBe("");
  });
});
