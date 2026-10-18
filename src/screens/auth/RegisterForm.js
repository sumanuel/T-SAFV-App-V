import { useRef, useState } from "react";
import { vs } from "../../utils/responsive";
import { PasswordField, TextField } from "./AuthFields";

export default function RegisterForm({
  palette,
  form,
  onChange,
  onSubmit,
  onFocusScroll,
}) {
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <TextField
        palette={palette}
        label="Nombre"
        value={form.fullName}
        onChangeText={(value) => onChange({ ...form, fullName: value })}
        placeholder="Nombre del usuario"
        returnKeyType="next"
        onFocus={() => onFocusScroll(vs(150))}
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <TextField
        ref={phoneRef}
        palette={palette}
        label="Telefono"
        value={form.phone}
        onChangeText={(value) => onChange({ ...form, phone: value })}
        placeholder="Numero de contacto"
        keyboardType="phone-pad"
        returnKeyType="next"
        onFocus={() => onFocusScroll(vs(210))}
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        palette={palette}
        label="Correo"
        value={form.email}
        onChangeText={(value) => onChange({ ...form, email: value })}
        placeholder="correo@dominio.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        onFocus={() => onFocusScroll(vs(270))}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <PasswordField
        ref={passwordRef}
        palette={palette}
        label="Contrasena"
        value={form.password}
        onChangeText={(value) => onChange({ ...form, password: value })}
        placeholder="Minimo 6 caracteres"
        visible={showPassword}
        onToggleVisible={() => setShowPassword((current) => !current)}
        returnKeyType="next"
        onFocus={() => onFocusScroll(vs(340))}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      <PasswordField
        ref={confirmPasswordRef}
        palette={palette}
        label="Confirmar contrasena"
        value={form.confirmPassword}
        onChangeText={(value) => onChange({ ...form, confirmPassword: value })}
        placeholder="Repite la contrasena"
        visible={showConfirmPassword}
        onToggleVisible={() => setShowConfirmPassword((current) => !current)}
        returnKeyType="done"
        onFocus={() => onFocusScroll(vs(410))}
        onSubmitEditing={onSubmit}
      />
    </>
  );
}
