# [FEATURE-001] Recuperar Contraseña Móvil

**Fecha**: 2026-07-30  
**Analista**: @analista-requerimientos  
**Proyecto**: T-SAFV-App-V (Expo React Native)  
**Backend**: T-SAFV-API (Node.js + Express + PostgreSQL)  
**Prioridad**: ALTA  
**Complejidad**: MEDIA

---

## Resumen ejecutivo

El feature de recuperación de contraseña actualmente **no funciona**. La función `recoverPassword` en `AuthContext.js` está vacía (solo hace un setTimeout mock). El usuario reporta que **no tiene una página web** para restablecer contraseña, por lo que todo el flujo debe ser **100% móvil**.

La solución propuesta usa **envío de código de 6 dígitos por email** que el usuario valida en la app móvil, seguido de una pantalla para establecer nueva contraseña. Este enfoque es estándar, seguro y completamente móvil.

**Pantallas a implementar**:

1. `ForgotPasswordScreen` - Solicita email y envía código
2. `VerifyCodeScreen` - Valida código de 6 dígitos
3. `ResetPasswordScreen` - Establece nueva contraseña

**Endpoints backend necesarios**:

1. `POST /api/auth/forgot-password` - Envía código por email
2. `POST /api/auth/verify-reset-code` - Valida código
3. `POST /api/auth/reset-password` - Actualiza contraseña

---

## Problema actual

### Estado actual del código

**Archivo**: `src/context/AuthContext.js` (líneas 230-235 aprox)

```javascript
const recoverPassword = async (email) => {
  setAuthBusy(true);
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
  } finally {
    setAuthBusy(false);
  }
};
```

**Problema**: La función está vacía, solo simula un delay. No llama a ningún endpoint del backend.

**Archivo**: `src/screens/AuthScreen.js`

- Tiene un modo `recovery` con UI funcional
- Llama a `recoverPassword(recoveryEmail)` (línea 174 aprox)
- La UI muestra mensaje de éxito pero el backend nunca se ejecuta

### Flujo esperado por el usuario

1. Usuario olvida su contraseña
2. Toca "¿Olvidaste tu contraseña?" en `AuthScreen`
3. Ingresa su email
4. Recibe código de 6 dígitos por email
5. Ingresa código en la app
6. Establece nueva contraseña
7. Inicia sesión con nueva contraseña

---

## Requerimientos funcionales

### RF-001: Solicitar código de recuperación

**Actor**: Usuario sin sesión  
**Precondición**: Usuario tiene cuenta registrada con email válido

**Flujo principal**:

1. Usuario toca "¿Olvidaste tu contraseña?" en `AuthScreen`
2. App muestra pantalla `ForgotPasswordScreen`
3. Usuario ingresa su email
4. Usuario toca "Enviar código"
5. App valida email (formato válido, no vacío)
6. App llama a `POST /api/auth/forgot-password` con `{ email }`
7. Backend genera código de 6 dígitos aleatorio
8. Backend guarda código en DB con expiración de 15 minutos
9. Backend envía email con código
10. Backend responde `{ success: true, message: "Código enviado" }`
11. App navega a `VerifyCodeScreen` pasando el email como contexto
12. App muestra mensaje: "Código enviado a tu email"

**Flujos alternativos**:

- **FA-001.1**: Email no existe en BD → Backend responde con error → App muestra "Email no registrado"
- **FA-001.2**: Error de red → App muestra "Sin conexión a internet"
- **FA-001.3**: Usuario ya solicitó código hace menos de 1 minuto → Backend rechaza con "Espera 1 minuto antes de solicitar nuevo código"

**Mockup ASCII - ForgotPasswordScreen**:

```
┌─────────────────────────────────────┐
│ ← Volver                            │
│                                     │
│  🔒 Recuperar contraseña            │
│                                     │
│  Ingresa tu email y te enviaremos  │
│  un código de 6 dígitos para       │
│  restablecer tu contraseña.         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 📧 Email                     │  │
│  │ usuario@example.com          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Enviar código              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ¿Ya tienes un código?              │
│  Verificar código →                 │
│                                     │
└─────────────────────────────────────┘
```

---

### RF-002: Verificar código de recuperación

**Actor**: Usuario con código enviado  
**Precondición**: Usuario solicitó código en RF-001

**Flujo principal**:

1. App muestra `VerifyCodeScreen` con campo de 6 dígitos
2. Usuario ingresa código recibido por email
3. Usuario toca "Verificar"
4. App valida código (6 dígitos, solo números)
5. App llama a `POST /api/auth/verify-reset-code` con `{ email, code }`
6. Backend valida que el código exista, no haya expirado y coincida
7. Backend genera token temporal de reseteo (válido 15 minutos)
8. Backend responde `{ success: true, resetToken: "xxx" }`
9. App guarda `resetToken` en estado local (no en AsyncStorage)
10. App navega a `ResetPasswordScreen` pasando `resetToken` como contexto
11. App muestra mensaje: "Código verificado"

**Flujos alternativos**:

- **FA-002.1**: Código incorrecto → Backend responde error → App muestra "Código incorrecto"
- **FA-002.2**: Código expirado (>15 min) → Backend responde error → App muestra "Código expirado. Solicita uno nuevo"
- **FA-002.3**: Intentos excedidos (>5 intentos) → Backend bloquea temporalmente → App muestra "Demasiados intentos. Espera 30 minutos"

**Mockup ASCII - VerifyCodeScreen**:

```
┌─────────────────────────────────────┐
│ ← Volver                            │
│                                     │
│  ✉️ Verifica tu email               │
│                                     │
│  Ingresa el código de 6 dígitos    │
│  que enviamos a:                    │
│                                     │
│  usuario@example.com                │
│                                     │
│  ┌───┬───┬───┬───┬───┬───┐         │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │         │
│  └───┴───┴───┴───┴───┴───┘         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Verificar                  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ¿No recibiste el código?           │
│  Reenviar código (30s) →            │
│                                     │
└─────────────────────────────────────┘
```

---

### RF-003: Establecer nueva contraseña

**Actor**: Usuario con código verificado  
**Precondición**: Usuario verificó código en RF-002

**Flujo principal**:

1. App muestra `ResetPasswordScreen` con dos campos: password y confirmPassword
2. Usuario ingresa nueva contraseña
3. Usuario confirma contraseña
4. Usuario toca "Guardar nueva contraseña"
5. App valida contraseñas (mínimo 8 caracteres, coinciden)
6. App llama a `POST /api/auth/reset-password` con `{ resetToken, newPassword }`
7. Backend valida `resetToken` (existe, no expirado)
8. Backend hashea nueva contraseña con bcrypt
9. Backend actualiza contraseña en BD
10. Backend invalida todos los tokens de reseteo del usuario
11. Backend responde `{ success: true, message: "Contraseña actualizada" }`
12. App muestra mensaje de éxito: "Contraseña actualizada exitosamente"
13. App navega a `AuthScreen` en modo `login`
14. App pre-rellena el email en el formulario de login

**Flujos alternativos**:

- **FA-003.1**: Contraseñas no coinciden → App muestra "Las contraseñas no coinciden"
- **FA-003.2**: Contraseña muy corta → App muestra "La contraseña debe tener al menos 8 caracteres"
- **FA-003.3**: `resetToken` expirado → Backend responde error → App muestra "Token expirado. Debes solicitar un nuevo código"

**Mockup ASCII - ResetPasswordScreen**:

```
┌─────────────────────────────────────┐
│ ← Volver                            │
│                                     │
│  🔐 Nueva contraseña                │
│                                     │
│  Establece una contraseña segura   │
│  con al menos 8 caracteres.         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🔒 Nueva contraseña          │  │
│  │ ••••••••                     │👁│
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🔒 Confirmar contraseña      │  │
│  │ ••••••••                     │👁│
│  └──────────────────────────────┘  │
│                                     │
│  ✓ Mínimo 8 caracteres              │
│  ✓ Las contraseñas coinciden        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Guardar nueva contraseña     │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## Requerimientos no funcionales

### RNF-001: Seguridad

- Código de 6 dígitos aleatorio (100000-999999)
- Código expira en 15 minutos
- Token de reseteo expira en 15 minutos
- Máximo 5 intentos de verificación por código
- Cooldown de 1 minuto entre solicitudes de código
- Contraseña hasheada con bcrypt (salt rounds: 10)
- Invalidar todos los tokens de reseteo al cambiar contraseña

### RNF-002: Email

- Asunto: "Código de recuperación - T-SAFV"
- Plantilla HTML con código destacado
- Remitente: `noreply@t-safv.com` (o configurado en env)
- Incluir link "No solicitaste este código? Contacta soporte"

### RNF-003: Performance

- Endpoint `/forgot-password`: < 3 segundos
- Endpoint `/verify-reset-code`: < 500ms
- Endpoint `/reset-password`: < 1 segundo

### RNF-004: UX

- Loading states visibles en todos los botones
- Mensajes de error claros en español
- Auto-focus en campos de formulario
- Botón "Reenviar código" con countdown de 30 segundos

---

## Modelo de datos (Backend)

### Tabla: `password_reset_codes`

```sql
CREATE TABLE password_reset_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  reset_token VARCHAR(255) UNIQUE,
  attempts INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP
);

CREATE INDEX idx_password_reset_user ON password_reset_codes(user_id);
CREATE INDEX idx_password_reset_code ON password_reset_codes(code);
CREATE INDEX idx_password_reset_token ON password_reset_codes(reset_token);
```

---

## Diseño de API

### Endpoint 1: Solicitar código de recuperación

**URL**: `POST /api/auth/forgot-password`

**Request**:

```json
{
  "email": "usuario@example.com"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Código enviado a tu email"
}
```

**Response** (404 Not Found):

```json
{
  "success": false,
  "error": "Email no registrado"
}
```

**Response** (429 Too Many Requests):

```json
{
  "success": false,
  "error": "Espera 1 minuto antes de solicitar nuevo código"
}
```

**Validaciones**:

- Email requerido
- Email formato válido
- Email existe en BD
- No solicitó código hace menos de 1 minuto

**Lógica**:

1. Buscar usuario por email
2. Invalidar códigos anteriores del usuario
3. Generar código aleatorio de 6 dígitos
4. Calcular `expires_at = NOW() + 15 minutos`
5. Insertar en `password_reset_codes`
6. Enviar email con código
7. Responder con éxito

---

### Endpoint 2: Verificar código

**URL**: `POST /api/auth/verify-reset-code`

**Request**:

```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Código incorrecto"
}
```

**Response** (410 Gone):

```json
{
  "success": false,
  "error": "Código expirado. Solicita uno nuevo"
}
```

**Response** (429 Too Many Requests):

```json
{
  "success": false,
  "error": "Demasiados intentos. Espera 30 minutos"
}
```

**Validaciones**:

- Email requerido
- Código requerido (6 dígitos)
- Usuario existe
- Código existe y no expirado
- Intentos < 5

**Lógica**:

1. Buscar usuario por email
2. Buscar código más reciente no usado
3. Incrementar `attempts`
4. Si `attempts >= 5` → Error 429
5. Si `expires_at < NOW()` → Error 410
6. Si código incorrecto → Error 400
7. Generar `resetToken` (JWT con payload: `{ userId, exp: 15 min }`)
8. Actualizar registro: `is_verified = true`, `reset_token = xxx`
9. Responder con `resetToken`

---

### Endpoint 3: Restablecer contraseña

**URL**: `POST /api/auth/reset-password`

**Request**:

```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "nuevaPassword123"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

**Validaciones**:

- `resetToken` requerido
- `newPassword` requerido (mínimo 8 caracteres)
- `resetToken` válido y no expirado
- Código asociado está verificado

**Lógica**:

1. Verificar JWT `resetToken`
2. Extraer `userId` del payload
3. Buscar código verificado asociado al `resetToken`
4. Si no existe o expiró → Error 400
5. Hashear `newPassword` con bcrypt
6. Actualizar `usuarios.password`
7. Marcar código como usado: `used_at = NOW()`
8. Invalidar todos los códigos del usuario
9. Responder con éxito

---

## Navegación

### Modificaciones en `App.js`

Agregar pantallas al objeto `screens`:

```javascript
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import VerifyCodeScreen from "./src/screens/VerifyCodeScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";

const screens = {
  // ... pantallas existentes
  ForgotPasswordScreen,
  VerifyCodeScreen,
  ResetPasswordScreen,
};
```

Renderizar pantallas:

```javascript
{
  activeScreen === "ForgotPasswordScreen" && (
    <ForgotPasswordScreen onNavigate={handleNavigate} />
  );
}
{
  activeScreen === "VerifyCodeScreen" && (
    <VerifyCodeScreen
      onNavigate={handleNavigate}
      screenContext={screenContext}
    />
  );
}
{
  activeScreen === "ResetPasswordScreen" && (
    <ResetPasswordScreen
      onNavigate={handleNavigate}
      screenContext={screenContext}
    />
  );
}
```

### Modificaciones en `AuthScreen.js`

Cambiar el botón "¿Olvidaste tu contraseña?" para navegar a `ForgotPasswordScreen`:

**Código actual** (línea 638 aprox):

```javascript
<Text
  style={styles.linkText}
  onPress={() => {
    setRecoveryEmail(loginForm.email);
    setMode(modes.recovery);
  }}
>
  ¿Olvidaste tu contraseña?
</Text>
```

**Código nuevo**:

```javascript
<Text
  style={styles.linkText}
  onPress={() => {
    onNavigate("ForgotPasswordScreen", { email: loginForm.email });
  }}
>
  ¿Olvidaste tu contraseña?
</Text>
```

**Nota**: Se asume que `AuthScreen` recibe `onNavigate` como prop desde `App.js`.

---

## Validaciones de formulario

### ForgotPasswordScreen

| Campo | Validación                                      | Mensaje de error        |
| ----- | ----------------------------------------------- | ----------------------- |
| Email | Requerido                                       | "El email es requerido" |
| Email | Formato válido (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) | "Email inválido"        |

### VerifyCodeScreen

| Campo  | Validación          | Mensaje de error                 |
| ------ | ------------------- | -------------------------------- |
| Código | Requerido           | "El código es requerido"         |
| Código | 6 dígitos numéricos | "El código debe tener 6 dígitos" |

### ResetPasswordScreen

| Campo              | Validación            | Mensaje de error                |
| ------------------ | --------------------- | ------------------------------- |
| Nueva contraseña   | Requerido             | "La contraseña es requerida"    |
| Nueva contraseña   | Mínimo 8 caracteres   | "Mínimo 8 caracteres"           |
| Confirmar password | Requerido             | "Debes confirmar la contraseña" |
| Confirmar password | Coincide con password | "Las contraseñas no coinciden"  |

---

## Estados de UI

### ForgotPasswordScreen

- **Initial**: Formulario vacío
- **Loading**: Botón "Enviar código" con spinner, deshabilitado
- **Success**: Navegación automática a `VerifyCodeScreen`
- **Error**: Mensaje de error bajo el campo email

### VerifyCodeScreen

- **Initial**: 6 campos vacíos, auto-focus en primer campo
- **Loading**: Botón "Verificar" con spinner, deshabilitado
- **Success**: Navegación automática a `ResetPasswordScreen`
- **Error**: Mensaje de error bajo los campos
- **Resend cooldown**: Botón "Reenviar código" deshabilitado con countdown (30s)

### ResetPasswordScreen

- **Initial**: Formulario vacío
- **Loading**: Botón "Guardar" con spinner, deshabilitado
- **Success**: Alert + navegación a `AuthScreen` modo login
- **Error**: Mensajes de error bajo cada campo

---

## Criterios de aceptación

### CA-001: Flujo completo funciona end-to-end

- [ ] Usuario puede solicitar código desde `ForgotPasswordScreen`
- [ ] Usuario recibe email con código de 6 dígitos
- [ ] Usuario puede verificar código en `VerifyCodeScreen`
- [ ] Usuario puede establecer nueva contraseña en `ResetPasswordScreen`
- [ ] Usuario puede iniciar sesión con nueva contraseña

### CA-002: Validaciones funcionan

- [ ] Email inválido muestra error
- [ ] Código incorrecto muestra error "Código incorrecto"
- [ ] Código expirado muestra error "Código expirado"
- [ ] Contraseñas no coinciden muestra error
- [ ] Contraseña muy corta muestra error

### CA-003: Seguridad implementada

- [ ] Código expira después de 15 minutos
- [ ] Token de reseteo expira después de 15 minutos
- [ ] Máximo 5 intentos de verificación por código
- [ ] Cooldown de 1 minuto entre solicitudes de código
- [ ] Contraseña hasheada con bcrypt en BD

### CA-004: UX pulida

- [ ] Loading states visibles en todos los botones
- [ ] Auto-focus en campos de formulario
- [ ] Botón "Reenviar código" con countdown de 30s
- [ ] Navegación fluida entre pantallas
- [ ] Email pre-rellenado en login después de reset exitoso

### CA-005: Emails enviados correctamente

- [ ] Email contiene código de 6 dígitos
- [ ] Email tiene asunto claro
- [ ] Email tiene diseño HTML legible
- [ ] Email incluye aviso de seguridad

---

## Riesgos identificados

| Riesgo                                | Probabilidad | Impacto | Mitigación                                                     |
| ------------------------------------- | ------------ | ------- | -------------------------------------------------------------- |
| Backend no tiene servicio de email    | Alta         | Alto    | Usar Nodemailer + Gmail SMTP o AWS SES                         |
| Emails llegan a spam                  | Media        | Alto    | Configurar SPF/DKIM, usar dominio verificado                   |
| Usuario no recibe email               | Media        | Alto    | Botón "Reenviar código" con cooldown                           |
| Token interceptado                    | Baja         | Alto    | Expiración corta (15 min), HTTPS obligatorio                   |
| Usuario intenta resetear cuenta ajena | Media        | Medio   | Solo se confirma "código enviado", sin revelar si email existe |

---

## Plan de testing

### Tests unitarios (Backend)

- `forgotPasswordController.test.js`
  - Genera código de 6 dígitos
  - Código expira en 15 minutos
  - Invalida códigos anteriores
  - Rechaza solicitudes con menos de 1 minuto de diferencia

- `verifyResetCodeController.test.js`
  - Valida código correcto
  - Rechaza código incorrecto
  - Rechaza código expirado
  - Incrementa intentos
  - Bloquea después de 5 intentos

- `resetPasswordController.test.js`
  - Valida token JWT
  - Hashea nueva contraseña
  - Invalida códigos después de uso

### Tests de integración (Backend)

- Flujo completo: forgot → verify → reset
- Email se envía correctamente
- BD se actualiza correctamente

### Tests manuales (Mobile)

- [ ] Flujo completo en Android
- [ ] Flujo completo en iOS
- [ ] Sin internet en cada paso
- [ ] Código expirado
- [ ] Código incorrecto 5 veces
- [ ] Teclado no tapa campos
- [ ] Navegación con back button
- [ ] Auto-focus funciona

---

## Dependencias

### Backend

- Servicio de email configurado (Nodemailer + SMTP)
- Variable de entorno `EMAIL_FROM`
- Variable de entorno `JWT_SECRET` (para resetToken)
- Migración de BD para tabla `password_reset_codes`

### Frontend

- Actualización de `App.js` para registrar pantallas
- Modificación de `AuthScreen.js` para navegar a `ForgotPasswordScreen`
- Nuevos servicios en `src/services/auth/`:
  - `forgotPasswordService.js`
  - `verifyCodeService.js`
  - `resetPasswordService.js`

---

## Estimación de tiempo

| Fase                       | Tiempo estimado          |
| -------------------------- | ------------------------ |
| Backend: Endpoints + Email | 6 horas                  |
| Frontend: Pantallas + Nav  | 8 horas                  |
| Testing + Ajustes          | 4 horas                  |
| **Total**                  | **18 horas (~2.5 días)** |

---

## Siguiente paso

Pasar esta especificación al agente **@planificador** para crear el plan de implementación detallado paso a paso.

---

**Última actualización**: 2026-07-30  
**Estado**: ✅ Especificación completa
