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
  - Avance: el manejo de 401 + renovación de sesión ya es común (`sessionRefresh.js`) y los 5 helpers de `sdk.js` son uno solo. Falta fusionar axios y fetch.
- [ ] **2.3 Partir pantallas gigantes** (App, L). `WorkshopHomeScreen` (~1000 líneas), `PropietariosScreen`, `AuthScreen`: extraer hooks de datos y subcomponentes.
- [ ] **2.4 Navegación** (App, L). Evaluar React Navigation / expo-router para reemplazar el estado manual de `App.js` y su `BackHandler`.

## Fase 3 — Rendimiento y escala

- [ ] **3.1 Paginación en API** (API, M). `limit`/`offset` (o cursor) en listados de propietarios, fiscales, unidades y traza/export.
  - Pendiente de decisión: la traza ya se acota por rango de fechas (hoy por defecto) y sus filtros, el total de pasajeros y la exportación se calculan en el cliente sobre la lista completa. Paginar en servidor exige moverlos al backend (búsqueda, filtro por fiscal, totales y export completo).
- [ ] **3.2 Listas virtualizadas** (App, M). Pasar `ScrollView + .map` a `FlatList` en Traza, Propietarios, Fiscales, Notificaciones, consumiendo la paginación de 3.1.
  - Hecho: Traza (la lista que más crece). Falta Propietarios, Fiscales y Notificaciones (estas dos últimas están acotadas en tamaño).

## Fase 4 — Producto

- [x] **4.1 Refresh token / sesión larga** (API + App, M). El JWT actual vence a las 24 h y el usuario cae al login. Emitir refresh token y renovarlo en el cliente HTTP.
  - Requiere aplicar la migración `0009_refresh_tokens.sql` y desplegar la API. Hasta entonces el login no devuelve `refresh_token` y la app se comporta como antes. TTL configurables: `ACCESS_TOKEN_TTL` (24h) y `REFRESH_TOKEN_TTL_DAYS` (30).
- [x] **4.2 Modo offline para fiscalizaciones** (App, L). Cola local de registros de fiscalización, sincronizada al recuperar conexión (con indicador de pendientes).
  - Requiere la migración `0010_registros_idempotencia.sql` en la API (idempotencia por `client_request_id`; sin ella un reintento perdido podría duplicar el registro). La app reenvía al abrir, al volver a primer plano y cada 45 s; guarda en caché la última lista de unidades para poder registrar sin red.
  - Limitación: no hay detección de red nativa (`NetInfo` exige un build nuevo); se reintenta por tiempo y eventos de la app.
- [ ] **4.3 OTA updates** (App, S). `expo-updates` para publicar cambios de JS sin nuevo `eas build`.

## Fase 5 — Calidad y proceso

- [ ] **5.1 Tests** (App, M). Jest + `jest-expo`; empezar por `accessControl.js`, `dateRange.js`, servicios y `AuthContext`.
  - Hecho: infraestructura (`npm test`) y pruebas de tokenStorage, sessionRefresh, sdk, fiscalQueue, caché de unidades, uuid, accessControl y dateRange. Falta `AuthContext` y componentes. API: `npm test` corre los unitarios; los de integración (`npm run test:integration`) escriben en la BD real del `.env`.
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
- **Orden de despliegue** de lo hecho en 4.1/4.2: (1) `npm run migrate` en la API (aplica 0009 y 0010), (2) desplegar la API, (3) `eas build` de la app. Con la API sin migrar, el login y las fiscalizaciones siguen funcionando sin las funciones nuevas.
