// Validaciones del formulario de acceso; devuelven el mensaje de error o null.

export function validateLoginForm(form) {
  if (!form.email.trim() || !form.password.trim()) {
    return "Debes completar correo y contrasena.";
  }
  return null;
}

export function validateRegisterForm(form) {
  if (
    !form.fullName.trim() ||
    !form.email.trim() ||
    !form.password.trim() ||
    !form.confirmPassword.trim()
  ) {
    return "Completa los datos obligatorios para crear la cuenta.";
  }
  if (form.password !== form.confirmPassword) {
    return "La confirmacion de contrasena no coincide.";
  }
  return null;
}
