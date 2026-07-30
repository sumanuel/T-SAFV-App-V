# Especificaciones funcionales: T-SAFV-App-V

Última actualización: 2026-07-30

## Resumen

Este documento detalla las especificaciones funcionales de T-SAFV-App-V, la aplicación móvil para gestión de asociaciones de transporte. Cada pantalla incluye casos de uso, flujos de interacción, validaciones y comportamiento esperado.

## Pantallas principales

1. [Autenticación](#1-autenticación)
2. [Dashboard / Home](#2-dashboard--home)
3. [Propietarios](#3-propietarios)
4. [Fiscales](#4-fiscales)
5. [Unidades](#5-unidades)
6. [Registros Fiscales](#6-registros-fiscales)
7. [Trazabilidad](#7-trazabilidad)
8. [Invitaciones](#8-invitaciones)
9. [Configuración de Asociación](#9-configuración-de-asociación)

---

## 1. Autenticación

### 1.1 Pantalla de Login

**Archivo**: `src/screens/AuthScreen.js`

**Caso de uso**: Usuario existente inicia sesión.

**Elementos de UI**:

- Input de email
- Input de password (oculto)
- Botón "Iniciar Sesión"
- Link "¿No tienes cuenta? Regístrate"

**Flujo normal**:

1. Usuario ingresa email y password
2. Usuario toca "Iniciar Sesión"
3. App llama a `AuthContext.login(email, password)`
4. Si éxito: Guarda token en AsyncStorage y navega a Home
5. Si error: Muestra Alert con mensaje de error

**Validaciones**:

- Email: Formato email válido, requerido
- Password: Requerido

**Mensajes de error**:

- "El email es requerido"
- "El password es requerido"
- "Email o contraseña incorrectos" (401 del backend)
- "Sin conexión a internet" (Network error)

---

### 1.2 Pantalla de Registro

**Archivo**: `src/screens/AuthScreen.js`

**Caso de uso**: Nuevo usuario se registra.

**Elementos de UI**:

- Input de nombre
- Input de email
- Input de password
- Input de confirmación de password
- Botón "Registrarse"
- Link "¿Ya tienes cuenta? Inicia sesión"

**Flujo normal**:

1. Usuario llena formulario
2. Usuario toca "Registrarse"
3. App valida que passwords coincidan
4. App llama a `AuthContext.register(nombre, email, password)`
5. Si éxito: Muestra Alert "Registro exitoso" y cambia a login
6. Si error: Muestra Alert con mensaje de error

**Validaciones**:

- Nombre: Min 2 caracteres, requerido
- Email: Formato válido, único, requerido
- Password: Min 8 caracteres, requerido
- Confirmación: Debe coincidir con password

**Mensajes de error**:

- "El nombre debe tener al menos 2 caracteres"
- "El email no es válido"
- "La contraseña debe tener al menos 8 caracteres"
- "Las contraseñas no coinciden"
- "El email ya está registrado" (409 del backend)

---

## 2. Dashboard / Home

### 2.1 Pantalla Principal

**Archivo**: `src/screens/WorkshopHomeScreen.js`

**Caso de uso**: Usuario ve resumen de la asociación activa.

**Elementos de UI**:

- Header con nombre de la asociación
- Cards de métricas:
  - Total de miembros
  - Total de unidades
  - Registros fiscales (hoy/mes)
  - Estado de licencia
- Botones de acceso rápido:
  - Ver Propietarios
  - Ver Fiscales
  - Ver Traza
  - Configuración

**Flujo normal**:

1. App carga `activeAssociation` de AuthContext
2. App llama a `associationService.getSummary(associationId)`
3. Muestra métricas en cards
4. Usuario toca card/botón → Navega a pantalla correspondiente

**Estados**:

- Loading: Muestra ActivityIndicator
- Error: Muestra mensaje y botón "Reintentar"
- Success: Muestra métricas

---

## 3. Propietarios

### 3.1 Lista de Propietarios

**Archivo**: `src/screens/PropietariosScreen.js`

**Caso de uso**: Admin/Propietario ve lista de propietarios de la asociación.

**Elementos de UI**:

- Header con título "Propietarios"
- Botón "Agregar Propietario" (solo ADMIN)
- FlatList de propietarios:
  - Nombre
  - Email
  - Total de unidades
  - Badge de estado (Activo/Suspendido)

**Flujo normal**:

1. App carga `activeAssociation` de AuthContext
2. App llama a `propietarioService.list(associationId)`
3. Muestra lista de propietarios
4. Usuario toca propietario → Navega a detalle/edición

**Acciones**:

- Tocar propietario: Ver detalle
- Tocar "Agregar": Navega a formulario de nuevo propietario (solo ADMIN)
- Pull to refresh: Recarga lista

**Estados**:

- Loading: ActivityIndicator
- Empty: "No hay propietarios registrados" + botón "Agregar"
- Success: Lista de propietarios

**Filtros de búsqueda** (opcional):

- Por nombre
- Por estado

---

### 3.2 Formulario de Propietario

**Archivo**: `src/screens/PropietarioFormScreen.js`

**Caso de uso**: Admin crea o edita un propietario.

**Modo Crear**:

- Input de nombre
- Input de email
- Input de password
- Input de confirmación de password
- Botón "Crear Propietario"

**Modo Editar**:

- Input de nombre (pre-llenado)
- Input de email (pre-llenado)
- Input de password (opcional, si se quiere cambiar)
- Botón "Guardar Cambios"

**Flujo de creación**:

1. Usuario llena formulario
2. Usuario toca "Crear Propietario"
3. App valida campos
4. App llama a `propietarioService.create({ nombre, email, password, rol: "PROPIETARIO" })`
5. Si éxito: Alert "Propietario creado" y navega atrás
6. Si error: Alert con mensaje de error

**Validaciones**:

- Nombre: Min 2 caracteres, requerido
- Email: Formato válido, único, requerido
- Password (crear): Min 8 caracteres, requerido
- Password (editar): Min 8 caracteres si se provee, opcional

**Mensajes de error**:

- "El nombre es requerido"
- "El email no es válido"
- "La contraseña debe tener al menos 8 caracteres"
- "El email ya está registrado"

---

## 4. Fiscales

### 4.1 Lista de Fiscales

**Archivo**: `src/screens/FiscalesScreen.js`

**Caso de uso**: Admin ve lista de fiscales de la asociación.

**Elementos de UI**:

- Header con título "Fiscales"
- Botón "Agregar Fiscal" (solo ADMIN)
- FlatList de fiscales:
  - Nombre
  - Email
  - Total de registros fiscales
  - Badge de estado

**Flujo normal**:

1. App carga `activeAssociation` de AuthContext
2. App llama a `fiscalService.list(associationId)`
3. Muestra lista de fiscales
4. Usuario toca fiscal → Ver detalle

**Acciones**:

- Tocar fiscal: Ver detalle/registros
- Tocar "Agregar": Formulario de nuevo fiscal (solo ADMIN)
- Pull to refresh: Recarga lista

---

### 4.2 Formulario de Fiscal

**Archivo**: `src/screens/FiscalFormScreen.js`

**Caso de uso**: Admin crea o edita un fiscal.

**UI y validaciones**: Idéntico a formulario de propietario, pero con `rol: "FISCAL"`.

---

## 5. Unidades

### 5.1 Formulario de Unidad

**Archivo**: `src/screens/VehicleFormScreen.js`

**Caso de uso**: Admin o Propietario crea/edita una unidad.

**Elementos de UI**:

- Selector de propietario (dropdown)
- Input de placa
- Input de número de unidad
- Input de número de puestos
- Input de modelo (opcional)
- Input de color (opcional)
- Botón "Guardar Unidad"

**Flujo de creación**:

1. Usuario selecciona propietario
2. Usuario llena datos de la unidad
3. Usuario toca "Guardar Unidad"
4. App valida campos
5. App llama a `vehicleService.create(associationId, data)`
6. Si éxito: Alert "Unidad creada" y navega atrás
7. Si error: Alert con error

**Validaciones**:

- Propietario: Requerido, debe ser PROPIETARIO activo de la asociación
- Placa: Requerido, formato válido (ej: ABC-123)
- Número de unidad: Requerido, único en asociación
- Número de puestos: Int, requerido, > 0

**Mensajes de error**:

- "Seleccione un propietario"
- "La placa es requerida"
- "El número de unidad es requerido"
- "El número de puestos debe ser mayor a 0"
- "El número de unidad ya existe en esta asociación"

---

## 6. Registros Fiscales

### 6.1 Formulario de Registro Fiscal

**Archivo**: `src/screens/FiscalRecordFormScreen.js`

**Caso de uso**: Fiscal crea un registro de fiscalización.

**Elementos de UI**:

- Selector de unidad (dropdown, solo unidades de la asociación)
- Input de número de pasajeros (numérico)
- TextArea de observaciones (opcional)
- Botón "Registrar Fiscalización"

**Flujo de creación**:

1. Usuario selecciona unidad
2. Usuario ingresa número de pasajeros
3. Usuario opcionalmente agrega observaciones
4. Usuario toca "Registrar Fiscalización"
5. App valida campos
6. App llama a `fiscalService.createRecord({ unidad_id, asociacion_id, pasajeros, observaciones })`
7. Si éxito: Alert "Registro creado" y navega atrás
8. Si error: Alert con error

**Validaciones**:

- Unidad: Requerido
- Pasajeros: Opcional, si se provee debe ser int >= 0
- Observaciones: Opcional, max 1000 caracteres

**Mensajes de error**:

- "Seleccione una unidad"
- "El número de pasajeros debe ser un número válido"

**Permisos**:

- Solo usuarios con rol FISCAL pueden crear registros

---

### 6.2 Lista de Registros Fiscales

**Pantalla**: Integrada en TrazaScreen o vista dedicada

**Caso de uso**: Ver historial de registros fiscales.

**Elementos de UI**:

- FlatList de registros:
  - Unidad (placa, número)
  - Fiscal (nombre)
  - Fecha y hora
  - Pasajeros
  - Observaciones
- Filtros:
  - Por unidad
  - Por fiscal
  - Por rango de fechas

**Flujo normal**:

1. App carga filtros seleccionados
2. App llama a `fiscalService.listRecords(associationId, filters)`
3. Muestra lista de registros
4. Usuario puede aplicar filtros

---

## 7. Trazabilidad

### 7.1 Pantalla de Traza

**Archivo**: `src/screens/TrazaScreen.js`

**Caso de uso**: Ver historial completo de fiscalizaciones de una unidad.

**Elementos de UI**:

- Selector de unidad
- Rango de fechas (desde/hasta)
- FlatList de registros:
  - Fecha y hora
  - Fiscal
  - Pasajeros
  - Observaciones
- Resumen:
  - Total de registros en el período
  - Promedio de pasajeros
  - Primer y último registro

**Flujo normal**:

1. Usuario selecciona unidad
2. Usuario opcionalmente ajusta rango de fechas
3. App llama a `trazaService.fetch(unidadId, { fecha_desde, fecha_hasta })`
4. Muestra registros y resumen

**Filtros**:

- Unidad (requerido)
- Fecha desde (opcional, default: hace 30 días)
- Fecha hasta (opcional, default: hoy)

**Acciones**:

- Exportar a Excel (solo ADMIN)
- Compartir resumen

---

## 8. Invitaciones

### 8.1 Pantalla de Invitaciones

**Archivo**: `src/screens/MemberInvitationsScreen.js`

**Caso de uso**: Admin envía invitaciones a nuevos miembros.

**Elementos de UI**:

- Botón "Enviar Invitación" (solo ADMIN)
- FlatList de invitaciones:
  - Email invitado
  - Rol invitado (PROPIETARIO/FISCAL)
  - Estado (Pendiente/Aceptada/Rechazada)
  - Fecha de envío
  - Fecha de aceptación/rechazo

**Flujo de envío de invitación**:

1. Admin toca "Enviar Invitación"
2. Modal con formulario:
   - Input de email
   - Selector de rol (PROPIETARIO/FISCAL)
3. Admin toca "Enviar"
4. App valida campos
5. App llama a `invitationService.create({ asociacion_id, email_invitado, rol_invitado })`
6. Si éxito: Alert "Invitación enviada", recarga lista
7. Si error: Alert con error

**Validaciones**:

- Email: Formato válido, requerido
- Rol: Enum (PROPIETARIO/FISCAL), requerido

**Permisos**:

- Solo ADMIN puede enviar invitaciones

---

### 8.2 Aceptar/Rechazar Invitación

**Flujo** (generalmente vía link externo):

1. Usuario recibe link con token de invitación
2. Al abrir link, app verifica token
3. Si usuario no está autenticado: Muestra login/registro
4. Si usuario está autenticado: Muestra confirmación
5. Usuario toca "Aceptar" o "Rechazar"
6. App llama a `invitationService.accept(token)` o `.reject(token)`
7. Si aceptada: Se crea membresía y usuario ve Home de la nueva asociación

---

## 9. Configuración de Asociación

### 9.1 Pantalla de Configuración

**Archivo**: `src/screens/AssociationSettingsScreen.js`

**Caso de uso**: Admin edita datos de la asociación.

**Elementos de UI**:

- Input de nombre de asociación
- Input de RIF
- Botón para subir logo (imagen)
- Selector de plan/licencia (solo lectura o editable según permisos)
- Botón "Guardar Cambios"

**Flujo de edición**:

1. App carga datos de `activeAssociation`
2. Muestra formulario pre-llenado
3. Usuario edita campos
4. Usuario toca "Guardar Cambios"
5. App valida campos
6. App llama a `associationService.update(associationId, data)`
7. Si éxito: Alert "Cambios guardados", actualiza AuthContext
8. Si error: Alert con error

**Validaciones**:

- Nombre: Min 3 caracteres, requerido
- RIF: Formato válido, opcional
- Logo: Max 12MB, formato PNG/JPG

**Permisos**:

- Solo ADMIN puede editar

---

## Reglas transversales

### Estados de membresía

| Estado     | Significado         | Puede acceder a la app  |
| ---------- | ------------------- | ----------------------- |
| ACTIVO     | Miembro activo      | ✓ Sí                    |
| SUSPENDIDO | Suspensión temporal | ✗ No (mensaje al login) |
| INACTIVO   | Baja definitiva     | ✗ No                    |

### Roles y permisos en UI

| Rol         | Ver Dashboard | Ver Propietarios | Crear Propietario | Ver Fiscales | Crear Fiscal | Ver Unidades | Crear Unidad | Registrar Fiscalización | Ver Traza   | Enviar Invitaciones | Editar Asociación |
| ----------- | ------------- | ---------------- | ----------------- | ------------ | ------------ | ------------ | ------------ | ----------------------- | ----------- | ------------------- | ----------------- |
| ADMIN       | ✓             | ✓                | ✓                 | ✓            | ✓            | ✓            | ✓            | ✗                       | ✓           | ✓                   | ✓                 |
| PROPIETARIO | ✓             | ✓                | ✗                 | ✓            | ✗            | ✓ (propias)  | ✓ (propias)  | ✗                       | ✓ (propias) | ✗                   | ✗                 |
| FISCAL      | ✓             | ✓                | ✗                 | ✓            | ✗            | ✓            | ✗            | ✓                       | ✓           | ✗                   | ✗                 |

**Nota**: La validación de permisos real se hace en backend. El frontend solo oculta/muestra botones según rol.

### Validaciones de formato

- **Email**: Regex básico `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password**: Min 8 caracteres, se recomienda incluir mayúsculas, números y símbolos
- **RIF**: Formato venezolano (ej: J-12345678-9)
- **Placa**: Formato venezolano (ej: ABC-123)

### Mensajes de UI en español

Todos los textos de la app están en español:

- Botones: "Guardar", "Cancelar", "Eliminar", etc.
- Placeholders: "Ingrese su email", "Contraseña", etc.
- Alerts: "Éxito", "Error", "Confirmar", etc.
- Empty states: "No hay datos disponibles", "Agrega tu primer propietario", etc.

### Navegación entre pantallas

La navegación se maneja manualmente en **App.js**:

```js
navigation.navigate("propietarios");
navigation.goBack();
```

El `BackHandler` de Android también se gestiona manualmente.

### Actualización de datos

Después de crear/editar/eliminar, las pantallas deben recargar datos:

```js
// En pantalla de lista
useEffect(() => {
  const unsubscribe = navigation.addListener("focus", () => {
    loadData();
  });
  return unsubscribe;
}, [navigation]);
```

### Indicadores de carga

Todas las operaciones asíncronas deben mostrar indicadores:

- `ActivityIndicator` para pantallas completas
- Deshabilitar botones durante operaciones
- Mensajes de feedback con `Alert.alert()`

### Manejo de errores

Todos los errores de servicios deben mostrarse al usuario:

```js
try {
  await someService.someMethod();
  Alert.alert("Éxito", "Operación completada");
} catch (error) {
  Alert.alert("Error", error.message || "Algo salió mal");
}
```

### Pull to refresh

Las listas deben soportar pull-to-refresh:

```js
<FlatList
  data={data}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
    />
  }
/>
```

---

## Cambios futuros planificados

- [ ] Implementar notificaciones push para invitaciones
- [ ] Dashboard con gráficos de trazabilidad
- [ ] Exportación de reportes en PDF
- [ ] Modo offline con sincronización
- [ ] Soporte para múltiples idiomas
- [ ] Integración con GPS para geolocalización de registros

---

## Referencias

- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura técnica
- [CONTEXTO_PROYECTO.md](./CONTEXTO_PROYECTO.md) - Contexto del proyecto
- [TESTS_REGRESION.md](./TESTS_REGRESION.md) - Tests de regresión
- [../T-SAFV-API/SPECS.md](../T-SAFV-API/SPECS.md) - Especificaciones backend
- [../T-SAFV-API/MATRIZ_APP_BACKEND.md](../T-SAFV-API/MATRIZ_APP_BACKEND.md) - Contrato API
