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

- [~] **3.1 Paginación en API** — *diferido: no hace falta con el volumen actual* (API, M). `limit`/`offset` (o cursor) en listados de propietarios, fiscales, unidades y traza/export.
  - **Volumen medido en producción (2026-10-18, solo conteos):** 13 registros de traza en total, 2 asociaciones, como máximo 9 registros acumulados, 3 en un día y 2 unidades / 2 propietarios en una asociación. Paginar hoy sería código sin uso.
  - **Reabrir cuando** una asociación pase de ~2.000 registros acumulados, o de ~300 en el rango de fechas que se consulta, o de ~500 unidades/propietarios. Medirlo con las mismas consultas de conteo (`registros_fiscalizacion` agrupado por `asociacion_id`).
  - Contexto: la traza ya se acota por rango de fechas (hoy por defecto) y sus filtros, el total de pasajeros y la exportación se calculan en el cliente sobre la lista completa. Paginar en servidor exige moverlos al backend.
  - **Propuesta de contrato** (aditiva, sin romper versiones anteriores de la app): `GET /api/asociaciones/:id/trazabilidad?fecha_inicio&fecha_fin&fiscal_id&q&limit&cursor` → `{ items, next_cursor, totales: { registros, pasajeros } }` cuando se envía `limit`; sin `limit` responde la lista de siempre. La exportación CSV pasaría a un endpoint propio que recorre todas las páginas. Antes de implementarlo conviene confirmar cuántos registros por rango se ven en producción.
- [x] **3.2 Listas virtualizadas** (App, M). Pasar `ScrollView + .map` a `FlatList` en Traza, Propietarios, Fiscales, Notificaciones, consumiendo la paginación de 3.1.
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

## Fase 6 — Fotos e incidencias (nuevo)

Plan completo en [docs/plans/PLAN-002-incidencias-y-fotos.md](docs/plans/PLAN-002-incidencias-y-fotos.md).

- [ ] **6.0 Confirmar tipos de incidencia y permisos** (Fase 0 del plan). Hay valores por defecto propuestos.
- [x] **6.1 API: adjuntos e incidencias** (API, L). Migraciones, modelos, rutas, pruebas y script de retención apagado.
  - Hecho en T-SAFV-API (rama `feature/adjuntos-e-incidencias`, 112 pruebas unitarias): migraciones 0011 y 0012, `/api/adjuntos`, `/api/incidencias` y `scripts/purgar_adjuntos.js`.
  - **Pendiente de verificar:** el SQL de las migraciones y los modelos no se probó contra un PostgreSQL real (no hay uno local y no se ejecuta DDL en la base compartida). Aplicar primero `npm run migrate` en una base de pruebas.
  - Decisiones que salieron al implementar: la API lee la foto antes de autenticar (si respondiera 401 con el cuerpo sin leer, la conexión se reinicia y la app no renovaría la sesión); el resumen de miniaturas es un endpoint aparte para no acoplar las consultas de Traza a la migración 0011.
- [x] **6.2 App: servicios, compresión y bandeja de salida con fotos** (App, L). Requiere `eas build` (`expo-image-manipulator`, permiso de cámara).
  - Hecho (rama `feature/fotos-servicios`): `photoPicker` (cámara/galería), `photoPipeline` (lado mayor 1280 px, JPEG 0,6, copia permanente), `photoFiles`, subida binaria en `sdk.js` (timeout de 60 s y renovación de sesión), endpoints de incidencias y fotos, y la **bandeja de salida** (`outbox.js`, antes `fiscalQueue.js`) que envía fiscalizaciones e incidencias en dos pasos (registro y luego foto). Una foto que falla nunca hace perder el registro; con la API sin actualizar (404 sin cuerpo) la foto se conserva y se reintenta. Lo pendiente de versiones anteriores sigue enviándose.
  - Versión de la app subida a **1.1.0** (módulos nativos nuevos; las OTA de la 1.0.0 no llegan a este build).
  - **Pendiente de probar en dispositivo:** la subida binaria (`fetch` con `Uint8Array` como cuerpo en React Native) y la cámara. Si el cuerpo binario no funcionara, el cambio se limita a `uploadAttachment` en `sdk.js` (alternativa: `File.createUploadTask` de `expo-file-system`).
- [x] **6.3 Foto opcional en la fiscalización y vista en Traza** (App, M). `PhotoAttachment` (cámara o galería, 1 foto), envío con `submitRecord` (en línea → bandeja si falla; si el registro llega pero la foto no, solo se reintenta la foto) y miniatura + visor en Traza (`useTrazaPhotos`). La miniatura descarga la foto completa (~150 KB): no hay endpoint de miniaturas; revisar si el volumen lo exige.
- [x] **6.4 Módulo Incidencias** (App, L). Lista con filtros por estado y búsqueda, formulario con hasta 3 fotos (envío en línea con respaldo en la bandeja, mismo `submitRecord` que las fiscalizaciones), detalle con visor de fotos y cambio de estado para administradores. Accesos desde Inicio y Más opciones. La notificación al propietario la envía la API. Permisos: ven todos; registran fiscales y administradores; solo el administrador cambia el estado. Pendiente (no incluido): crear una incidencia desde una fiscalización concreta (`registro_id`) y paginación de la lista (se piden las 200 más recientes).
- [ ] **6.5 Definir la conservación de fotos** (negocio). **PENDIENTE**: sin definir; mientras tanto no se borra nada. Recomendación: 90 días para fotos de pasajeros y 12 meses tras el cierre para fotos de incidencias (ver §6 del plan).

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
