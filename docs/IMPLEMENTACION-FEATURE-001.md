# FEATURE-001 Recuperar Contraseña Móvil - Implementación Completada ✅

**Fecha**: 2026-07-30  
**Basado en**: PLAN-001-recuperar-password-movil.md  
**Estado**: ✅ Código completo, requiere configuración SMTP

---

## ✅ Archivos creados

### Backend (T-SAFV-API)

**Migración de base de datos**:

- ✅ `database/migrations/20260730000000-create-password-reset-codes.js`

**Servicios**:

- ✅ `src/services/emailService.js` (Nodemailer)
- ✅ `src/templates/emails/reset-password.html`

**Controllers**:

- ✅ `src/controllers/auth/forgotPasswordController.js`
- ✅ `src/controllers/auth/verifyResetCodeController.js`
- ✅ `src/controllers/auth/resetPasswordController.js`

**Rutas**:

- ✅ `src/routes/authRoutes.js` (3 rutas agregadas)

### Frontend (T-SAFV-App-V)

**Servicios HTTP**:

- ✅ `src/services/auth/forgotPasswordService.js`
- ✅ `src/services/auth/verifyCodeService.js`
- ✅ `src/services/auth/resetPasswordService.js`

**Pantallas**:

- ✅ `src/screens/ForgotPasswordScreen.js`
- ✅ `src/screens/VerifyCodeScreen.js`
- ✅ `src/screens/ResetPasswordScreen.js`

**Integración**:

- ✅ `App.js` (importación y navegación)
- ✅ `src/screens/AuthScreen.js` (botón de recuperación)

---

## ⚙️ Configuración requerida (CRÍTICO)

### Paso 1: Variables de entorno backend

Edita `T-SAFV-API/.env` y agrega:

```env
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
EMAIL_FROM=T-SAFV <noreply@t-safv.com>

# JWT Secret (ya debería existir)
JWT_SECRET=tu-secret-existente
```

**Nota importante para Gmail**:

1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en dos pasos"
3. Ir a "Contraseñas de aplicación"
4. Generar una contraseña para "Correo" en "Aplicación"
5. Usar esa contraseña de 16 dígitos en `SMTP_PASS`

**Alternativa profesional (AWS SES o similar)**:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu-access-key
SMTP_PASS=tu-secret-key
EMAIL_FROM=T-SAFV <noreply@tu-dominio.com>
```

### Paso 2: Ejecutar migración de base de datos

En terminal:

```bash
cd d:\Mis\ proyectos\T-SAFV\T-SAFV-API
npx sequelize-cli db:migrate
```

Esto creará la tabla `password_reset_codes` en PostgreSQL.

### Paso 3: Instalar dependencia Nodemailer (si no está instalada)

```bash
cd d:\Mis\ proyectos\T-SAFV\T-SAFV-API
npm install nodemailer
```

### Paso 4: Verificar que el backend arranca sin errores

```bash
cd d:\Mis\ proyectos\T-SAFV\T-SAFV-API
npm start
```

Verifica que no hay errores de imports o configuración.

---

## 🧪 Testing manual

### Paso 1: Probar flujo completo

1. Ejecutar app móvil:

```bash
cd d:\Mis\ proyectos\T-SAFV\T-SAFV-App-V
npm run android  # o npm run ios
```

2. En la pantalla de login, tocar "Recuperar contraseña"
3. Ingresar un email registrado
4. Verificar que llegue el email (revisar bandeja de spam)
5. Ingresar el código de 6 dígitos
6. Ingresar nueva contraseña (mínimo 8 caracteres)
7. Guardar y verificar que se puede iniciar sesión

### Paso 2: Validar casos de error

- [ ] Email no registrado → Debe mostrar "Email no registrado"
- [ ] Código incorrecto → Debe incrementar intentos (máximo 5)
- [ ] Código expirado (esperar 15 minutos) → Debe mostrar "Código expirado"
- [ ] Contraseñas no coinciden → Debe mostrar error en tiempo real
- [ ] Sin internet → Debe mostrar "Sin conexión a internet"
- [ ] Reenviar código → Debe tener cooldown de 30 segundos

### Paso 3: Validar UX

- [ ] Campos de código auto-focus secuencial
- [ ] Backspace regresa al campo anterior
- [ ] Toggle show/hide password funciona
- [ ] Loading indicators visibles
- [ ] Navegación con back button funciona
- [ ] Email se pre-rellena al navegar entre pantallas

---

## 🔒 Seguridad implementada

✅ **Códigos temporales**: Expiran en 15 minutos  
✅ **Cooldown**: 1 minuto entre solicitudes  
✅ **Intentos limitados**: Máximo 5 intentos de verificación  
✅ **Tokens JWT**: resetToken válido 15 minutos  
✅ **Bcrypt**: Contraseñas hasheadas con bcrypt (10 rounds)  
✅ **Invalidación**: Códigos usados se marcan con `used_at`  
✅ **Cascada**: Al eliminar usuario se borran sus códigos

---

## 📊 Endpoints implementados

### POST /api/auth/forgot-password

**Request**:

```json
{
  "email": "usuario@example.com"
}
```

**Response 200**:

```json
{
  "success": true,
  "message": "Código enviado a tu email"
}
```

**Response 404**:

```json
{
  "success": false,
  "error": "Email no registrado"
}
```

**Response 429**:

```json
{
  "success": false,
  "error": "Espera 1 minuto antes de solicitar nuevo código"
}
```

---

### POST /api/auth/verify-reset-code

**Request**:

```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

**Response 200**:

```json
{
  "success": true,
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response 400**:

```json
{
  "success": false,
  "error": "Código incorrecto"
}
```

**Response 410**:

```json
{
  "success": false,
  "error": "Código expirado. Solicita uno nuevo"
}
```

**Response 429**:

```json
{
  "success": false,
  "error": "Demasiados intentos. Espera 30 minutos y solicita un nuevo código"
}
```

---

### POST /api/auth/reset-password

**Request**:

```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "newPassword": "nuevaContraseña123"
}
```

**Response 200**:

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Response 400**:

```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

---

## 📝 Próximos pasos

### Ahora (requerido para funcionamiento)

1. [ ] Configurar variables SMTP en `.env`
2. [ ] Ejecutar migración de base de datos
3. [ ] Instalar `nodemailer` si no está
4. [ ] Probar flujo completo manualmente
5. [ ] Validar emails llegan correctamente (revisar spam)

### Próximos pasos recomendados (opcional)

1. [ ] Ejecutar agente @qa-esceptico para crear tests automatizados
2. [ ] Configurar SPF/DKIM para evitar spam (si es producción)
3. [ ] Agregar logs de auditoría (¿quién recuperó contraseña cuándo?)
4. [ ] Personalizar template de email con branding
5. [ ] Agregar analytics (¿cuántos usuarios recuperan contraseña?)

---

## 🐛 Troubleshooting

### Email no llega

**Síntoma**: Usuario no recibe código  
**Causa posible**:

1. SMTP no configurado correctamente
2. Email llega a spam
3. Credenciales Gmail incorrectas

**Solución**:

1. Verificar logs del servidor: `console.log` en emailService.js
2. Revisar carpeta spam del usuario
3. Si usa Gmail, verificar "Contraseña de aplicación" (NO la contraseña normal)
4. Probar con un servicio SMTP profesional (AWS SES, SendGrid)

---

### Migración falla

**Síntoma**: Error al ejecutar `db:migrate`  
**Causa posible**: PostgreSQL no conectado o tabla ya existe

**Solución**:

```bash
# Ver estado de migraciones
npx sequelize-cli db:migrate:status

# Si ya existe, hacer rollback
npx sequelize-cli db:migrate:undo

# Volver a ejecutar
npx sequelize-cli db:migrate
```

---

### Código no verifica

**Síntoma**: Código correcto dice "Código incorrecto"  
**Causa posible**: Código expirado o ya usado

**Solución**:

1. Verificar en PostgreSQL:

```sql
SELECT * FROM password_reset_codes
WHERE user_id = (SELECT id FROM usuarios WHERE email = 'usuario@example.com')
ORDER BY created_at DESC
LIMIT 1;
```

2. Ver columnas: `code`, `expires_at`, `used_at`, `attempts`
3. Si `used_at` no es NULL → código ya fue usado
4. Si `NOW() > expires_at` → código expiró
5. Si `attempts >= 5` → excedió intentos

---

### App no navega a pantallas de recuperación

**Síntoma**: Botón "Recuperar contraseña" no hace nada  
**Causa posible**: onNavigate no está siendo pasado correctamente

**Solución**:

1. Verificar que `App.js` pasa `onNavigate` a `AuthScreen`
2. Verificar que `AuthScreen` recibe `onNavigate` como prop
3. Ver logs en consola de React Native

---

## ✅ Checklist de deployment

Antes de pasar a producción:

- [ ] Migración ejecutada en DB de producción
- [ ] Variables SMTP configuradas en producción
- [ ] Email template personalizado con branding
- [ ] SPF/DKIM configurados para dominio de email
- [ ] Probado flujo completo en dispositivo real
- [ ] Logs de auditoría implementados
- [ ] Monitoreo de tasa de error configurado
- [ ] Tests automatizados ejecutados (@qa-esceptico)
- [ ] Code review completado (@code-reviewer)
- [ ] Documentación actualizada

---

**Última actualización**: 2026-07-30  
**Estado**: ✅ Código completo, requiere configuración SMTP  
**Responsable**: @programador-senior
