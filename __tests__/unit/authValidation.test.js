import {
  validateLoginForm,
  validateRegisterForm,
} from "../../src/utils/authValidation";

describe("validateLoginForm", () => {
  it("pide correo y contrasena", () => {
    const message = "Debes completar correo y contrasena.";
    expect(validateLoginForm({ email: "", password: "" })).toBe(message);
    expect(validateLoginForm({ email: "a@b.c", password: "" })).toBe(message);
    expect(validateLoginForm({ email: "  ", password: "x" })).toBe(message);
  });

  it("acepta un formulario completo", () => {
    expect(validateLoginForm({ email: "a@b.c", password: "x" })).toBeNull();
  });
});

describe("validateRegisterForm", () => {
  const valid = {
    fullName: "Ana Pérez",
    phone: "",
    email: "a@b.c",
    password: "secreto123",
    confirmPassword: "secreto123",
  };

  it("el telefono es opcional", () => {
    expect(validateRegisterForm(valid)).toBeNull();
  });

  it.each(["fullName", "email", "password", "confirmPassword"])(
    "exige %s",
    (field) => {
      expect(validateRegisterForm({ ...valid, [field]: "  " })).toBe(
        "Completa los datos obligatorios para crear la cuenta.",
      );
    },
  );

  it("detecta que la confirmacion no coincide", () => {
    expect(validateRegisterForm({ ...valid, confirmPassword: "otra" })).toBe(
      "La confirmacion de contrasena no coincide.",
    );
  });
});
