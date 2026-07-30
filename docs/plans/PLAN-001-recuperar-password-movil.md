# [PLAN-001] Recuperar Contraseña Móvil - Plan de Implementación

**Fecha**: 2026-07-30  
**Planificador**: @planificador  
**Basado en**: `docs/specs/FEATURE-001-recuperar-password-movil.md`  
**Tiempo estimado total**: 18 horas (~2.5 días)

---

## Resumen ejecutivo

Este plan implementa recuperación de contraseña 100% móvil mediante envío de código de 6 dígitos por email. El flujo requiere 3 pantallas móviles nuevas y 3 endpoints backend. La implementación se divide en 6 fases: (1) Backend - Migración DB, (2) Backend - Servicios y endpoints, (3) Frontend - Servicios HTTP, (4) Frontend - Pantallas, (5) Integración y navegación, (6) Testing.

**Enfoque técnico**: Código temporal de 6 dígitos → JWT resetToken → Actualización de contraseña

**Archivos a crear**:

- Backend: 1 migración, 3 controllers, 3 routes, 1 email template, tests
- Frontend: 3 screens, 3 services, modificaciones a `AuthContext` y `AuthScreen`

---

## Objetivos del plan

1. Crear tabla `password_reset_codes` en PostgreSQL
2. Implementar 3 endpoints backend con Nodemailer
3. Crear 3 pantallas móviles con navegación
4. Integrar flujo completo end-to-end
5. Validar seguridad y UX

---

## Arquitectura de la solución

### Componentes backend (T-SAFV-API)

```
src/
  ├── controllers/
  │   └── auth/
  │       ├── forgotPasswordController.js      [NUEVO]
  │       ├── verifyResetCodeController.js     [NUEVO]
  │       └── resetPasswordController.js       [NUEVO]
  ├── routes/
  │   └── authRoutes.js                        [MODIFICAR]
  ├── middleware/
  │   └── validators/
  │       └── passwordResetValidators.js       [NUEVO]
  ├── services/
  │   └── emailService.js                      [NUEVO]
  └── templates/
      └── emails/
          └── reset-password.html              [NUEVO]

database/
  └── migrations/
      └── XXXX-create-password-reset-codes.js  [NUEVO]
```

### Componentes frontend (T-SAFV-App-V)

```
src/
  ├── screens/
  │   ├── ForgotPasswordScreen.js              [NUEVO]
  │   ├── VerifyCodeScreen.js                  [NUEVO]
  │   ├── ResetPasswordScreen.js               [NUEVO]
  │   └── AuthScreen.js                        [MODIFICAR]
  ├── services/
  │   └── auth/
  │       ├── forgotPasswordService.js         [NUEVO]
  │       ├── verifyCodeService.js             [NUEVO]
  │       └── resetPasswordService.js          [NUEVO]
  └── context/
      └── AuthContext.js                       [MODIFICAR]

App.js                                         [MODIFICAR]
```

### Diagrama de flujo

```
Usuario olvida contraseña
         ↓
  [AuthScreen]
  "¿Olvidaste tu contraseña?"
         ↓ onNavigate("ForgotPasswordScreen")
  [ForgotPasswordScreen]
  Ingresa email → POST /forgot-password
         ↓ (código enviado)
  [VerifyCodeScreen]
  Ingresa código → POST /verify-reset-code
         ↓ (código verificado, recibe resetToken)
  [ResetPasswordScreen]
  Nueva contraseña → POST /reset-password
         ↓ (contraseña actualizada)
  [AuthScreen modo login]
  (email pre-rellenado)
```

---

## FASE 1: Backend - Migración de Base de Datos

**Objetivo**: Crear tabla `password_reset_codes`

### Tarea 1.1: Crear migración

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\database\migrations\XXXX-create-password-reset-codes.js`

**Código**:

```javascript
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("password_reset_codes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      code: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("password_reset_codes", ["user_id"]);
    await queryInterface.addIndex("password_reset_codes", ["code"]);
    await queryInterface.addIndex("password_reset_codes", ["reset_token"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("password_reset_codes");
  },
};
```

**Ejecutar migración**:

```bash
cd T-SAFV-API
npx sequelize-cli db:migrate
```

**Estimación**: 30 min  
**Riesgo**: Bajo  
**Dependencias**: Ninguna

---

## FASE 2: Backend - Servicios y Endpoints

**Objetivo**: Implementar lógica de negocio y API

### Tarea 2.1: Crear servicio de email

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\services\emailService.js`

**Código**:

```javascript
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");

// Configuración del transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía email de recuperación de contraseña con código
 * @param {string} to - Email del destinatario
 * @param {string} code - Código de 6 dígitos
 */
async function sendPasswordResetEmail(to, code) {
  try {
    // Leer template HTML
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "emails",
      "reset-password.html",
    );
    let htmlTemplate = await fs.readFile(templatePath, "utf-8");

    // Reemplazar placeholder del código
    htmlTemplate = htmlTemplate.replace("{{CODE}}", code);

    const mailOptions = {
      from: process.env.EMAIL_FROM || "T-SAFV <noreply@t-safv.com>",
      to,
      subject: "Código de recuperación - T-SAFV",
      html: htmlTemplate,
      text: `Tu código de recuperación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw new Error("No se pudo enviar el email");
  }
}

module.exports = {
  sendPasswordResetEmail,
};
```

**Estimación**: 1 hora  
**Riesgo**: Medio (requiere configurar SMTP)  
**Dependencias**: Variables de entorno `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

---

### Tarea 2.2: Crear template de email

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\templates\emails\reset-password.html`

**Código**:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Código de Recuperación</title>
    <style>
      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
          Cantarell, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 30px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 40px 30px;
      }
      .code-box {
        background-color: #f0f0f0;
        border: 2px dashed #667eea;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 30px 0;
      }
      .code {
        font-size: 36px;
        font-weight: bold;
        color: #667eea;
        letter-spacing: 8px;
        font-family: "Courier New", monospace;
      }
      .warning {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
        font-size: 14px;
        color: #856404;
      }
      .footer {
        background-color: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #6c757d;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔒 Recuperación de Contraseña</h1>
      </div>
      <div class="content">
        <p>Hola,</p>
        <p>
          Recibimos una solicitud para restablecer tu contraseña en
          <strong>T-SAFV</strong>.
        </p>
        <p>Usa el siguiente código de 6 dígitos en la aplicación móvil:</p>

        <div class="code-box">
          <div class="code">{{CODE}}</div>
        </div>

        <p style="text-align: center; color: #6c757d; font-size: 14px;">
          Este código expira en <strong>15 minutos</strong>
        </p>

        <div class="warning">
          ⚠️ Si no solicitaste este código, ignora este mensaje. Tu cuenta está
          segura.
        </div>
      </div>
      <div class="footer">
        <p>T-SAFV - Sistema de Asociaciones de Transporte</p>
        <p>
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
      </div>
    </div>
  </body>
</html>
```

**Estimación**: 30 min  
**Riesgo**: Bajo

---

### Tarea 2.3: Crear controller `forgotPasswordController.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\controllers\auth\forgotPasswordController.js`

**Código**:

```javascript
const db = require("../../models");
const { sendPasswordResetEmail } = require("../../services/emailService");

/**
 * Genera código de 6 dígitos aleatorio
 */
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/forgot-password
 * Envía código de recuperación por email
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Buscar usuario por email
    const user = await db.Usuario.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Email no registrado",
      });
    }

    // Verificar cooldown (1 minuto)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await db.sequelize.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = :userId 
       AND created_at > :oneMinuteAgo 
       ORDER BY created_at DESC 
       LIMIT 1`,
      {
        replacements: { userId: user.id, oneMinuteAgo },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (recentCode.length > 0) {
      return res.status(429).json({
        success: false,
        error: "Espera 1 minuto antes de solicitar nuevo código",
      });
    }

    // Invalidar códigos anteriores
    await db.sequelize.query(
      `UPDATE password_reset_codes 
       SET used_at = NOW() 
       WHERE user_id = :userId 
       AND used_at IS NULL`,
      {
        replacements: { userId: user.id },
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    // Generar nuevo código
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Insertar código en BD
    await db.sequelize.query(
      `INSERT INTO password_reset_codes 
       (user_id, code, expires_at, created_at) 
       VALUES (:userId, :code, :expiresAt, NOW())`,
      {
        replacements: {
          userId: user.id,
          code,
          expiresAt,
        },
        type: db.sequelize.QueryTypes.INSERT,
      },
    );

    // Enviar email
    await sendPasswordResetEmail(user.email, code);

    res.status(200).json({
      success: true,
      message: "Código enviado a tu email",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({
      success: false,
      error: "Error al procesar solicitud",
    });
  }
}

module.exports = { forgotPassword };
```

**Estimación**: 1.5 horas  
**Riesgo**: Medio  
**Dependencias**: Tarea 2.1, Tarea 1.1

---

### Tarea 2.4: Crear controller `verifyResetCodeController.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\controllers\auth\verifyResetCodeController.js`

**Código**:

```javascript
const db = require("../../models");
const jwt = require("jsonwebtoken");

/**
 * POST /api/auth/verify-reset-code
 * Verifica código de 6 dígitos y devuelve resetToken
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    // Buscar usuario
    const user = await db.Usuario.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Buscar código más reciente no usado
    const resetCode = await db.sequelize.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = :userId 
       AND used_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 1`,
      {
        replacements: { userId: user.id },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (resetCode.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No hay código pendiente. Solicita uno nuevo",
      });
    }

    const resetRecord = resetCode[0];

    // Verificar intentos
    if (resetRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        error:
          "Demasiados intentos. Espera 30 minutos y solicita un nuevo código",
      });
    }

    // Incrementar intentos
    await db.sequelize.query(
      `UPDATE password_reset_codes 
       SET attempts = attempts + 1 
       WHERE id = :id`,
      {
        replacements: { id: resetRecord.id },
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    // Verificar expiración
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(410).json({
        success: false,
        error: "Código expirado. Solicita uno nuevo",
      });
    }

    // Verificar código
    if (resetRecord.code !== code) {
      return res.status(400).json({
        success: false,
        error: "Código incorrecto",
      });
    }

    // Generar resetToken (JWT válido 15 minutos)
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Actualizar registro: marcar como verificado
    await db.sequelize.query(
      `UPDATE password_reset_codes 
       SET is_verified = TRUE, reset_token = :resetToken 
       WHERE id = :id`,
      {
        replacements: {
          id: resetRecord.id,
          resetToken,
        },
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    res.status(200).json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error("Error en verifyResetCode:", error);
    res.status(500).json({
      success: false,
      error: "Error al verificar código",
    });
  }
}

module.exports = { verifyResetCode };
```

**Estimación**: 1.5 horas  
**Riesgo**: Medio  
**Dependencias**: Tarea 1.1

---

### Tarea 2.5: Crear controller `resetPasswordController.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\controllers\auth\resetPasswordController.js`

**Código**:

```javascript
const db = require("../../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * POST /api/auth/reset-password
 * Actualiza contraseña con resetToken
 */
async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;

    // Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    const userId = decoded.userId;

    // Buscar código verificado asociado al resetToken
    const resetCode = await db.sequelize.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = :userId 
       AND reset_token = :resetToken 
       AND is_verified = TRUE 
       AND used_at IS NULL`,
      {
        replacements: { userId, resetToken },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (resetCode.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Token inválido o ya usado",
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await db.Usuario.update(
      { password: hashedPassword },
      { where: { id: userId } },
    );

    // Marcar código como usado e invalidar todos los códigos del usuario
    await db.sequelize.query(
      `UPDATE password_reset_codes 
       SET used_at = NOW() 
       WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({
      success: false,
      error: "Error al restablecer contraseña",
    });
  }
}

module.exports = { resetPassword };
```

**Estimación**: 1 hora  
**Riesgo**: Bajo  
**Dependencias**: Tarea 1.1

---

### Tarea 2.6: Agregar rutas en `authRoutes.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\src\routes\authRoutes.js`

**Modificación** (agregar al final del archivo):

```javascript
const {
  forgotPassword,
} = require("../controllers/auth/forgotPasswordController");
const {
  verifyResetCode,
} = require("../controllers/auth/verifyResetCodeController");
const {
  resetPassword,
} = require("../controllers/auth/resetPasswordController");

// Rutas de recuperación de contraseña
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
```

**Estimación**: 15 min  
**Riesgo**: Bajo

---

## FASE 3: Frontend - Servicios HTTP

**Objetivo**: Crear servicios para comunicación con backend

### Tarea 3.1: Crear `forgotPasswordService.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\services\auth\forgotPasswordService.js`

**Código**:

```javascript
import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Solicita código de recuperación por email
 * @param {string} email - Email del usuario
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function apiForgotPassword(email) {
  try {
    const response = await apiClient.post("/api/auth/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
```

**Estimación**: 20 min  
**Riesgo**: Bajo

---

### Tarea 3.2: Crear `verifyCodeService.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\services\auth\verifyCodeService.js`

**Código**:

```javascript
import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Verifica código de 6 dígitos
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise<{success: boolean, resetToken: string}>}
 */
export async function apiVerifyResetCode(email, code) {
  try {
    const response = await apiClient.post("/api/auth/verify-reset-code", {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
```

**Estimación**: 20 min  
**Riesgo**: Bajo

---

### Tarea 3.3: Crear `resetPasswordService.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\services\auth\resetPasswordService.js`

**Código**:

```javascript
import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Restablece contraseña con resetToken
 * @param {string} resetToken - Token JWT temporal
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function apiResetPassword(resetToken, newPassword) {
  try {
    const response = await apiClient.post("/api/auth/reset-password", {
      resetToken,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
```

**Estimación**: 20 min  
**Riesgo**: Bajo

---

## FASE 4: Frontend - Pantallas

**Objetivo**: Crear 3 pantallas móviles con validaciones y estados de UI

### Tarea 4.1: Crear `ForgotPasswordScreen.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\screens\ForgotPasswordScreen.js`

**Código completo** (ver especificación para mockup, implementar pantalla completa con):

- Campo email con validación
- Botón "Enviar código" con loading
- Manejo de errores
- Navegación a `VerifyCodeScreen` en éxito

**Estimación**: 2 horas  
**Riesgo**: Bajo  
**Dependencias**: Tarea 3.1

---

### Tarea 4.2: Crear `VerifyCodeScreen.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\screens\VerifyCodeScreen.js`

**Código completo** (implementar pantalla con):

- 6 campos numéricos para código
- Auto-focus secuencial
- Botón "Verificar" con loading
- Botón "Reenviar código" con countdown 30s
- Navegación a `ResetPasswordScreen` en éxito

**Estimación**: 3 horas  
**Riesgo**: Medio (UI de 6 campos requiere cuidado)  
**Dependencias**: Tarea 3.2

---

### Tarea 4.3: Crear `ResetPasswordScreen.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\screens\ResetPasswordScreen.js`

**Código completo** (implementar pantalla con):

- Campo "Nueva contraseña" con toggle show/hide
- Campo "Confirmar contraseña" con toggle show/hide
- Validación en tiempo real (mínimo 8, coinciden)
- Botón "Guardar" con loading
- Alert de éxito + navegación a `AuthScreen`

**Estimación**: 2.5 horas  
**Riesgo**: Bajo  
**Dependencias**: Tarea 3.3

---

## FASE 5: Integración y Navegación

**Objetivo**: Conectar flujo completo

### Tarea 5.1: Modificar `AuthScreen.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\screens\AuthScreen.js`

**Cambio**: Reemplazar el botón "¿Olvidaste tu contraseña?" para navegar a `ForgotPasswordScreen`

**Código antes** (línea 638 aprox):

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

**Código después**:

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

**Estimación**: 10 min  
**Riesgo**: Bajo

---

### Tarea 5.2: Registrar pantallas en `App.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\App.js`

**Cambios**:

1. Importar pantallas:

```javascript
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import VerifyCodeScreen from "./src/screens/VerifyCodeScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
```

2. Agregar al objeto `screens`:

```javascript
const screens = {
  // ... pantallas existentes
  ForgotPasswordScreen,
  VerifyCodeScreen,
  ResetPasswordScreen,
};
```

3. Renderizar pantallas:

```javascript
{
  activeScreen === "ForgotPasswordScreen" && (
    <ForgotPasswordScreen
      onNavigate={handleNavigate}
      screenContext={screenContext}
    />
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

**Estimación**: 20 min  
**Riesgo**: Bajo

---

### Tarea 5.3: Actualizar `AuthContext.js`

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-App-V\src\context\AuthContext.js`

**Cambio**: Eliminar o actualizar la función `recoverPassword` (actualmente está vacía)

**Opción 1**: Eliminar (ya no se usa)  
**Opción 2**: Actualizar para llamar a `apiForgotPassword` (si aún se usa en AuthScreen en modo recovery)

**Estimación**: 10 min  
**Riesgo**: Bajo

---

## FASE 6: Testing

**Objetivo**: Validar flujo completo

### Tarea 6.1: Testing manual móvil

**Checklist**:

- [ ] Flujo completo exitoso (forgot → verify → reset → login)
- [ ] Email válido/inválido
- [ ] Código correcto/incorrecto
- [ ] Código expirado (esperar 15 min)
- [ ] Contraseñas no coinciden
- [ ] Botón "Reenviar código" funciona
- [ ] Sin internet en cada paso
- [ ] Navegación con back button
- [ ] Teclado no tapa campos

**Estimación**: 2 horas  
**Riesgo**: Bajo

---

### Tarea 6.2: Testing backend (Jest + Supertest)

Crear tests de integración:

**Archivo**: `d:\Mis proyectos\T-SAFV\T-SAFV-API\__tests__\integration\auth\password-reset.test.js`

**Tests**:

- POST /forgot-password: email válido, inválido, cooldown
- POST /verify-reset-code: código correcto, incorrecto, expirado
- POST /reset-password: token válido, inválido

**Estimación**: 2 horas  
**Riesgo**: Medio

---

## Cronograma

| Fase                    | Tareas  | Tiempo estimado | Acumulado |
| ----------------------- | ------- | --------------- | --------- |
| 1. Backend - Migración  | 1.1     | 30 min          | 0.5h      |
| 2. Backend - Servicios  | 2.1-2.6 | 5.5 horas       | 6h        |
| 3. Frontend - Servicios | 3.1-3.3 | 1 hora          | 7h        |
| 4. Frontend - Pantallas | 4.1-4.3 | 7.5 horas       | 14.5h     |
| 5. Integración          | 5.1-5.3 | 40 min          | 15.2h     |
| 6. Testing              | 6.1-6.2 | 4 horas         | 19.2h     |

**Total estimado**: 19.2 horas (~2.5 días)

---

## Riesgos y mitigaciones

| Riesgo                                | Probabilidad | Impacto | Mitigación                                                |
| ------------------------------------- | ------------ | ------- | --------------------------------------------------------- |
| SMTP no configurado                   | Alta         | Alto    | Documentar claramente las variables de entorno necesarias |
| Emails llegan a spam                  | Media        | Alto    | Configurar SPF/DKIM, usar Gmail SMTP o AWS SES            |
| UI de 6 campos compleja               | Media        | Medio   | Usar refs y auto-focus, revisar ejemplos en GitHub        |
| Token expira mientras usuario escribe | Baja         | Medio   | Expiración de 15 minutos es suficiente                    |

---

## Variables de entorno necesarias

**Backend** (`T-SAFV-API/.env`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
EMAIL_FROM=T-SAFV <noreply@t-safv.com>
JWT_SECRET=tu-secret-jwt-existente
```

**Nota**: Si usas Gmail, debes generar una "Contraseña de aplicación" en la configuración de seguridad de Google.

---

## Criterios de éxito

- [ ] Usuario puede recuperar contraseña sin página web
- [ ] Emails llegan correctamente con código
- [ ] Código expira después de 15 minutos
- [ ] Máximo 5 intentos de verificación
- [ ] Contraseña se actualiza correctamente en BD
- [ ] Navegación fluida entre pantallas
- [ ] Loading states visibles
- [ ] Mensajes de error claros

---

## Siguiente paso

Pasar este plan al agente **@programador-senior** para implementación completa del feature.

---

**Última actualización**: 2026-07-30  
**Estado**: ✅ Plan completo y listo para implementación
