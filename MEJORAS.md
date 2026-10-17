# Plan de mejoras técnicas — T-SAFV-App-V

Resultado del análisis del código (Expo SDK 57, RN 0.86, ~16.5k líneas, 26 pantallas).
Marca cada ítem con `[x]` al completarlo y deja el commit de referencia.

Leyenda: **App** = este repo · **API** = `../T-SAFV-API` · esfuerzo: S (horas) / M (1-2 días) / L (varios días).

## Fase 1 — Seguridad y estabilidad (rápidas, bajo riesgo)

- [x] **1.1 Token en SecureStore** (App, S). Mover `@auth_token` de `AsyncStorage` a `expo-secure-store` (Keystore/Keychain), con migración transparente del token existente. Archivos: `src/context/AuthContext.js`, `src/services/api/apiClient.js`.
- [x] **1.2 ErrorBoundary global** (App, S). Evitar la pantalla en blanco ante un error de render; mostrar pantalla de recuperación con botón "Reintentar". Archivo: `App.js` + componente nuevo.
- [x] **1.3 Limpiar `console.log`** (App, S). Reemplazar los ~21 `console.*` por un `logger` que se silencia en producción (`__DEV__`).
- [x] **1.4 Accesibilidad básica** (App, S). `accessibilityLabel`/`accessibilityRole` en botones de solo ícono (papeleras, atrás, notificaciones, tab bar).

## Fase 2 — Deuda técnica

- [x] **2.1 Eliminar código heredado** (App, M). `services/mock/mockStore.js`, `WorkshopSetupScreen`, `WorkshopManagementScreen`, `TeamAccessScreen`, `Stock*` (screens + `stockItemService`), `services/workshops/*`, y el "workshop" mock sintetizado en `AuthContext`.
- [ ] **2.2 Unificar cliente HTTP** (App, M). Un solo cliente (hoy: axios en auth + `fetch` en `sdk.js`) con token, timeout y manejo de 401 en un único lugar.
- [ ] **2.3 Partir pantallas gigantes** (App, L). `WorkshopHomeScreen` (~1000 líneas), `PropietariosScreen`, `AuthScreen`: extraer hooks de datos y subcomponentes.
- [ ] **2.4 Navegación** (App, L). Evaluar React Navigation / expo-router para reemplazar el estado manual de `App.js` y su `BackHandler`.

## Fase 3 — Rendimiento y escala

- [ ] **3.1 Paginación en API** (API, M). `limit`/`offset` (o cursor) en listados de propietarios, fiscales, unidades y traza/export.
- [ ] **3.2 Listas virtualizadas** (App, M). Pasar `ScrollView + .map` a `FlatList` en Traza, Propietarios, Fiscales, Notificaciones, consumiendo la paginación de 3.1.

## Fase 4 — Producto

- [ ] **4.1 Refresh token / sesión larga** (API + App, M). El JWT actual vence a las 24 h y el usuario cae al login. Emitir refresh token y renovarlo en el cliente HTTP.
- [ ] **4.2 Modo offline para fiscalizaciones** (App, L). Cola local de registros de fiscalización, sincronizada al recuperar conexión (con indicador de pendientes).
- [ ] **4.3 OTA updates** (App, S). `expo-updates` para publicar cambios de JS sin nuevo `eas build`.

## Fase 5 — Calidad y proceso

- [ ] **5.1 Tests** (App, M). Jest + `jest-expo`; empezar por `accessControl.js`, `dateRange.js`, servicios y `AuthContext`.
- [ ] **5.2 ESLint + Prettier** (App, S).
- [ ] **5.3 CI** (App, S). GitHub Actions: lint + tests + `npx expo export --platform android`.
- [x] **5.4 Documentación al día** (App, S). `AGENTS.md` aún dice Expo SDK 54 / RN 0.81 (ahora 57 / 0.86).

## Hallazgos pendientes (surgidos durante la ejecución)

- [ ] El tile **"Asociaciones · Gestionar"** de `WorkshopMoreScreen` no hace nada (navega a la misma pantalla). Eliminarlo o conectarlo a un destino real.
- [ ] `src/constants/accessControl.js` conserva permisos de inventario (`inventory.manage`, `canManageInventory`) que ya no tienen pantallas. Revisar y quitar.
- [ ] `AuthContext` aún sintetiza una `membership` con `workshopId` fijo solo por compatibilidad (App.js y More la usan para el rol). Migrar esos usos a `activeAssociation` + `userProfile.role` y eliminarla.
- Resuelto en 2.1: el botón **"Reiniciar datos de la asociación"** solo limpiaba un mock local y fallaba al leer `result.deletedDocuments`; se eliminó. Si se quiere esa función de verdad, requiere endpoint en la API.

## Notas

- Todo cambio que requiera build nativo (p. ej. `expo-secure-store`, `expo-updates`) necesita un `eas build` nuevo para verse en dispositivo.
- Validación principal de frontend: `npx expo export --platform android --output-dir .expo-export-check`.
- Orden sugerido: Fase 1 → 2.1 → 5.x → 3.x → 4.x → resto de 2.
