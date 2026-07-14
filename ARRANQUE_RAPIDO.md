# T-SAFV-App-V — Arranque Rápido

Última actualización: 2026-07-07

## Stack

- Expo SDK 54, React 19, React Native 0.81.
- **Sin Firebase** — datos mock en memoria + autenticación real vía T-SAFV-API (JWT).
- Axios para llamadas HTTP.

## Autenticación

Login y registro conectan directamente con **T-SAFV-API** en `src/services/auth/authService.js`.
El token JWT se persiste en AsyncStorage (`@auth_token` y `@auth_user`).

### URL de la API

Editar `src/services/api/apiClient.js`:

```js
// Emulador Android
export const API_BASE_URL = "http://10.0.2.2:3000";

// Dispositivo físico (misma red WiFi)
export const API_BASE_URL = "http://192.168.1.10:3000";

// iOS Simulator
export const API_BASE_URL = "http://localhost:3000";
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run start          # expo start
npm run android        # expo start --android
```

## Validar bundle

```bash
npx expo export --platform android
```

## Datos Mock

Los datos de demostración viven en `src/services/mock/mockStore.js`.
El store es in-memory: se reinicia cuando la app se recarga.

Colecciones disponibles:

- **Clientes**: 3 clientes de ejemplo (Pedro Rodríguez, Ana Gómez, Carlos López)
- **Vehículos**: 4 vehículos asignados a los clientes
- **Diagnósticos**: 3 diagnósticos (in-review, quoted, approved)
- **Órdenes de trabajo**: 2 órdenes (in-progress, ready)
- **Repuestos**: 3 repuestos vinculados a las órdenes
- **Inventario**: 5 ítems de stock (4 repuestos + 1 herramienta)
- **Avances**: 4 entradas de progreso en las órdenes
- **Equipo**: 2 colaboradores mock (mecánico + recepción)

## Estructura del proyecto

```
src/
  context/
    AuthContext.js         # JWT auth — conecta con T-SAFV-API para login/register
    ThemeContext.js        # Tema claro/oscuro — copia idéntica del original
  constants/
    accessControl.js      # Roles, permisos, helpers
  utils/
    responsive.js         # rf(), spacing, borderRadius
    dateRange.js          # Utilidades de rango de fechas
  services/
    api/
      apiClient.js        # Axios client con interceptor JWT
    auth/
      authService.js      # apiLogin(), apiRegister() → T-SAFV-API
    mock/
      mockStore.js        # In-memory CRUD store + seed data
      mockDelay.js        # Simula latencia de red
    clients/clientService.js
    vehicles/vehicleService.js
    diagnostics/
      diagnosticService.js
      diagnosticQuotePdfService.js  # Stub — reemplazar con PDF real
    workOrders/workOrderService.js
    progressEntries/progressEntryService.js
    spareParts/sparePartService.js
    stockItems/stockItemService.js
    admin/staffAdmin.js
    workshops/
      workshopService.js
      workshopSession.js   # Devuelve siempre "workshop-1"
      workshopResetService.js
  components/common/
    WorkshopTabBar.js
    WorkshopScreenHeader.js
    MetricCard.js
    DateRangeFilterModal.js
  screens/
    (24 pantallas — idénticas visualmente a Auto-Guardian-Taller)
```

## Para conectar la API real

1. Implementar endpoints en T-SAFV-API para cada dominio
2. Reemplazar las funciones en `src/services/*/` con llamadas `apiClient.get/post/put/delete`
3. Actualizar `AuthContext.js` si la respuesta del login cambia

## Diferencias con Auto-Guardian-Taller

| Aspecto        | Auto-Guardian-Taller         | T-SAFV-App-V         |
| -------------- | ---------------------------- | -------------------- |
| Auth           | Firebase Auth                | JWT via T-SAFV-API   |
| Base de datos  | Firestore                    | Datos mock in-memory |
| IDs            | Secuenciales por transacción | Generados localmente |
| Taller         | Multi-taller con setup       | Único taller mock    |
| Invitaciones   | Firebase + correo            | No soportadas        |
| PDF cotización | expo-print real              | Stub (retorna null)  |
| Roles          | Del perfil Firestore         | Del token JWT        |
