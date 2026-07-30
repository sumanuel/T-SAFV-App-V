# Changelog - T-SAFV-App-V

Todos los cambios notables en la aplicación móvil T-SAFV serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Agregado (2026-07-30) - FEATURE-001: Recuperación de Contraseña Móvil

- **Pantalla ForgotPasswordScreen**: Solicitud de código de recuperación por email
- **Pantalla VerifyCodeScreen**: Verificación de código de 6 dígitos con auto-focus secuencial
- **Pantalla ResetPasswordScreen**: Establecimiento de nueva contraseña con validación en tiempo real
- **Servicios HTTP**: 3 servicios para comunicación con backend (forgotPassword, verifyCode, resetPassword)
- **Navegación**: Integración completa en App.js con sistema de navegación de autenticación
- **UX mejorada**: Validación en tiempo real, loading indicators, mensajes de error claros
- **Seguridad**: Códigos de 6 dígitos con expiración de 15 minutos, límite de 5 intentos
- **Botón de reenvío**: Cooldown de 30 segundos para reenviar código
- **Toggle password**: Show/hide password en campos de contraseña
- **Requisitos visuales**: Indicadores de cumplimiento de requisitos de contraseña

### Backend (T-SAFV-API)

- **POST /api/auth/forgot-password**: Endpoint para solicitar código de recuperación
- **POST /api/auth/verify-reset-code**: Endpoint para verificar código y obtener resetToken
- **POST /api/auth/reset-password**: Endpoint para actualizar contraseña con resetToken
- **Tabla password_reset_codes**: Migración de base de datos con campos de seguridad
- **Servicio de email**: Integración con Nodemailer para envío de códigos
- **Template HTML**: Email responsive con branding de T-SAFV
- **Cooldown**: 1 minuto entre solicitudes de código
- **Intentos limitados**: Máximo 5 intentos de verificación
- **Invalidación automática**: Códigos usados se marcan como inválidos

### Documentación

- **FEATURE-001-recuperar-password-movil.md**: Especificación técnica completa
- **PLAN-001-recuperar-password-movil.md**: Plan de implementación con 6 fases
- **IMPLEMENTACION-FEATURE-001.md**: Guía de configuración y deployment
- **Troubleshooting**: Guía de resolución de problemas comunes

---

## [1.0.0] - 2026-XX-XX (versión actual en producción)

### Agregado

- Autenticación JWT con backend
- Gestión de asociaciones de transporte
- Gestión de propietarios
- Gestión de fiscales
- Gestión de unidades/vehículos
- Sistema de traza de fiscalizaciones
- Sistema de invitaciones a colaboradores
- Gestión de stock (disponible desde Más)
- Perfiles de usuario con roles (ADMIN, PROPIETARIO, FISCAL)
- Tema claro/oscuro
- Navegación manual con estado local
- Contextos de formularios para navegación entre pantallas
- Pantalla de onboarding

---

## Convenciones de este Changelog

### Categorías

- **Agregado** (Added): Nuevas funcionalidades
- **Cambiado** (Changed): Cambios en funcionalidades existentes
- **Obsoleto** (Deprecated): Funcionalidades que serán removidas pronto
- **Removido** (Removed): Funcionalidades removidas
- **Corregido** (Fixed): Corrección de bugs
- **Seguridad** (Security): Cambios relacionados con vulnerabilidades

### Formato de entrada

```
- **Componente/Feature**: Descripción breve del cambio
```

---

**Mantenedor**: Equipo de desarrollo T-SAFV  
**Última actualización**: 2026-07-30
