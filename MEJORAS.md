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
- [x] **2.2 Unificar cliente HTTP** (App, M). Un solo cliente (hoy: axios en auth + `fetch` en `sdk.js`) con token, timeout y manejo de 401 en un único lugar.
  - Hecho: todo pasa por `request()` de `sdk.js` (token, 401 + renovación de sesión, timeout de 30 s). `apiClient.js` es un cliente delgado sobre él y se eliminó la dependencia `axios`.
- [x] **2.3 Partir pantallas gigantes** (App, L). `WorkshopHomeScreen` (~1000 líneas), `PropietariosScreen`, `AuthScreen`: extraer hooks de datos y subcomponentes.
  - Hecho: `WorkshopHomeScreen` 1005 → 330 líneas, `PropietariosScreen` 916 → 432, `AuthScreen` 889 → 249 (utilidades puras con pruebas, hooks `useUnits`/`useUnreadNotifications` y componentes en `screens/home`, `screens/propietarios`, `screens/auth`). En el camino se eliminó la recuperación de contraseña falsa de `AuthScreen`.
  - También hechas: `WorkshopMoreScreen` 726 → 130, `MemberInvitationsScreen` 736 → 162, `VehicleFormScreen` 726 → 261, `TrazaScreen` 693 → 216, `AssociationSettingsScreen` 681 → 350. Las mayores ahora son `FiscalRecordFormScreen` (501) y `OnboardingScreen` (490); no se tocaron (el formulario de fiscalización es el flujo crítico de campo y conviene dividirlo con pruebas en dispositivo).
  - Correcciones que salieron al dividir: comparación `"undefined" === "undefined"` al detectar al creador de la asociación, JSON de redes sociales inválido con mensaje técnico, envío de invitaciones duplicado en dos funciones.
  - Red de seguridad: `__tests__/unit/styleReferences.test.js` verifica que todo `styles.X` exista en su `StyleSheet` (en React Native un estilo faltante se ignora sin aviso al mover JSX entre archivos).
- [ ] **2.4 Navegación** (App, L). Evaluar React Navigation / expo-router para reemplazar el estado manual de `App.js` y su `BackHandler`.
  - **Evaluación (sin migrar):** hoy `App.js` mantiene ~12 estados de contexto y una cadena de `if` para el botón atrás, y cada pantalla recibe `onBack`/`onOpenX` por props. React Navigation (stack nativo dentro de tabs) aportaría atrás por gesto, transiciones y deep links (p. ej. abrir la traza desde una notificación push). Costo: toca todas las pantallas y exige probar cada flujo en dispositivo.
  - **Recomendación:** hacerlo después de terminar 2.3 y con un dispositivo de pruebas, migrando una pantalla a la vez con un envoltorio de compatibilidad (los `onBack` siguen funcionando mientras tanto). No es urgente: no bloquea ninguna función.

## Fase 3 — Rendimiento y escala

- [ ] **3.1 Paginación en API** (API, M). `limit`/`offset` (o cursor) en listados de propietarios, fiscales, unidades y traza/export.
  - Pendiente de decisión: la traza ya se acota por rango de fechas (hoy por defecto) y sus filtros, el total de pasajeros y la exportación se calculan en el cliente sobre la lista completa. Paginar en servidor exige moverlos al backend.
  - **Propuesta de contrato** (aditiva, sin romper versiones anteriores de la app): `GET /api/asociaciones/:id/trazabilidad?fecha_inicio&fecha_fin&fiscal_id&q&limit&cursor` → `{ items, next_cursor, totales: { registros, pasajeros } }` cuando se envía `limit`; sin `limit` responde la lista de siempre. La exportación CSV pasaría a un endpoint propio que recorre todas las páginas. Antes de implementarlo conviene confirmar cuántos registros por rango se ven en producción.
- [ ] **3.2 Listas virtualizadas** (App, M). Pasar `ScrollView + .map` a `FlatList` en Traza, Propietarios, Fiscales, Notificaciones, consumiendo la paginación de 3.1.
  - Hecho: Traza, Inicio (unidades) y Propietarios. Fiscales y Notificaciones se dejan como están: son listas acotadas (las notificaciones se piden con límite de 30) y el cambio no justifica el riesgo.

## Fase 4 — Producto

- [x] **4.1 Refresh token / sesión larga** (API + App, M). El JWT actual vence a las 24 h y el usuario cae al login. Emitir refresh token y renovarlo en el cliente HTTP.
  - Requiere aplicar la migración `0009_refresh_tokens.sql` y desplegar la API. Hasta entonces el login no devuelve `refresh_token` y la app se comporta como antes. TTL configurables: `ACCESS_TOKEN_TTL` (24h) y `REFRESH_TOKEN_TTL_DAYS` (30).
- [x] **4.2 Modo offline para fiscalizaciones** (App, L). Cola local de registros de fiscalización, sincronizada al recuperar conexión (con indicador de pendientes).
  - Requiere la migración `0010_registros_idempotencia.sql` en la API (idempotencia por `client_request_id`; sin ella un reintento perdido podría duplicar el registro). La app reenvía al abrir, al volver a primer plano y cada 45 s; guarda en caché la última lista de unidades para poder registrar sin red.
  - Limitación: no hay detección de red nativa (`NetInfo` exige un build nuevo); se reintenta por tiempo y eventos de la app.
- [x] **4.3 OTA updates** (App, S). `expo-updates` para publicar cambios de JS sin nuevo `eas build`.
  - Configurado (`runtimeVersion` por `appVersion`, URL de actualizaciones y canales `development`/`preview`/`production` en `eas.json`). **No se pudo probar**: requiere un `eas build` nuevo y publicar con `eas update`. Los builds anteriores no reciben OTA.
  - Regla: cada vez que cambie código nativo (módulos nuevos, SDK, plugins) hay que subir `version` en `app.config.js` y hacer un build nuevo; si no, una actualización de JS podría llegar a un build que no tiene sus módulos nativos.

## Fase 5 — Calidad y proceso

- [x] **5.1 Tests** (App, M). Jest + `jest-expo`; empezar por `accessControl.js`, `dateRange.js`, servicios y `AuthContext`.
  - Hecho: infraestructura (`npm test`) y pruebas de tokenStorage, sessionRefresh, sdk, apiClient, fiscalQueue, caché de unidades, uuid, accessControl, dateRange, validación de acceso, utilidades de Inicio, Propietarios, invitaciones, formulario de unidades, datos de la asociación, traza y acceso, y la verificación de estilos. Falta `AuthContext` y pruebas de componentes (requieren `@testing-library/react-native`). API: `npm test` corre los unitarios; los de integración (`npm run test:integration`) escriben en la BD real del `.env`.
- [x] **5.2 ESLint + Prettier** (App, S).
  - `npm run lint` (0 errores; quedan ~30 avisos de patrones de hooks heredados, que desaparecen al partir las pantallas, ver 2.3) y `npm run format:check`. Las reglas nuevas de React Compiler (`set-state-in-effect`, `refs`, `immutability`) están como aviso, no como error.
- [x] **5.3 CI** (App, S). GitHub Actions: lint + tests + `npx expo export --platform android`.
  - `.github/workflows/ci.yml`. No se pudo ejecutar localmente: la primera corrida en GitHub confirmará que `expo export` funciona sin `google-services.json`.
- [x] **5.4 Documentación al día** (App, S). `AGENTS.md` aún dice Expo SDK 54 / RN 0.81 (ahora 57 / 0.86).

## Hallazgos pendientes (surgidos durante la ejecución)

- [x] El tile **"Asociaciones · Gestionar"** de `WorkshopMoreScreen` no hace nada (navega a la misma pantalla). Eliminarlo o conectarlo a un destino real.
- [x] `src/constants/accessControl.js` conserva permisos de inventario (`inventory.manage`, `canManageInventory`) que ya no tienen pantallas. Revisar y quitar.
- [x] `AuthContext` aún sintetizaba una `membership` con `workshopId` fijo solo por compatibilidad (App.js y More la usan para el rol). Migrar esos usos a `activeAssociation` + `userProfile.role` y eliminarla.
- Resuelto en 2.1: el botón **"Reiniciar datos de la asociación"** solo limpiaba un mock local y fallaba al leer `result.deletedDocuments`; se eliminó. Si se quiere esa función de verdad, requiere endpoint en la API.

## Notas

- Todo cambio que requiera build nativo (p. ej. `expo-secure-store`, `expo-updates`) necesita un `eas build` nuevo para verse en dispositivo.
- Validación principal de frontend: `npx expo export --platform android --output-dir .expo-export-check`.
- Orden sugerido: Fase 1 → 2.1 → 5.x → 3.x → 4.x → resto de 2.
- **Orden de despliegue** de lo hecho en 4.1/4.2: (1) `npm run migrate` en la API (aplica 0009 y 0010), (2) desplegar la API, (3) `eas build` de la app. Con la API sin migrar, el login y las fiscalizaciones siguen funcionando sin las funciones nuevas.
