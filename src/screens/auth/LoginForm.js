import { useRef, useState } from "react";
import { vs } from "../../utils/responsive";
import { PasswordField, TextField } from "./AuthFields";

export default function LoginForm({
  palette,
  form,
  onChange,
  onSubmit,
  onFocusScroll,
}) {
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <TextField
        palette={palette}
        label="Correo"
        value={form.email}
        onChangeText={(value) => onChange({ ...form, email: value })}
        placeholder="correo@dominio.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        onFocus={() => onFocusScroll(vs(180))}
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
        returnKeyType="done"
        onFocus={() => onFocusScroll(vs(240))}
        onSubmitEditing={onSubmit}
      />
    </>
  );
}
