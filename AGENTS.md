# T-SAFV-App-V — Agent Guide

## Stack

- Expo SDK 54, React 19, React Native 0.81.
- Autenticación JWT contra T-SAFV-API.
- Sin Firebase.
- Persistencia local con AsyncStorage.
- HTTP mixto: Axios en auth, `fetch` envuelto en `src/services/api/sdk.js` para dominio.

Comandos útiles:

```bash
npm install
npm run start
npm run android
npx expo export --platform android --output-dir .expo-export-check
```

Usa el export de Expo como validación principal de frontend. No hay test suite, lint ni typecheck configurados.

## Documentación

- Setup y comandos: [ARRANQUE_RAPIDO.md](ARRANQUE_RAPIDO.md)
- Backend relacionado: [../T-SAFV-API/ARRANQUE_RAPIDO.md](../T-SAFV-API/ARRANQUE_RAPIDO.md)
- Contexto backend: [../T-SAFV-API/CONTEXTO_PROYECTO.md](../T-SAFV-API/CONTEXTO_PROYECTO.md)

No dupliques esas guías aquí. Enlázalas.

## Arquitectura real

La navegación activa no usa React Navigation. Todo el flujo vive en [App.js](App.js) con estado manual:

- `activeScreen` controla la pantalla visible.
- Contextos locales guardan formularios y retorno entre pantallas.
- El `BackHandler` también se resuelve manualmente en `App.js`.

Prioriza estas pantallas porque son las activas del dominio actual:

- Inicio: [src/screens/WorkshopHomeScreen.js](src/screens/WorkshopHomeScreen.js)
- Propietarios: [src/screens/PropietariosScreen.js](src/screens/PropietariosScreen.js)
- Fiscales: [src/screens/FiscalesScreen.js](src/screens/FiscalesScreen.js)
- Traza: [src/screens/TrazaScreen.js](src/screens/TrazaScreen.js)
- Invitaciones oficiales: [src/screens/MemberInvitationsScreen.js](src/screens/MemberInvitationsScreen.js)
- Datos de la asociación: [src/screens/AssociationSettingsScreen.js](src/screens/AssociationSettingsScreen.js)
- Registro fiscal: [src/screens/FiscalRecordFormScreen.js](src/screens/FiscalRecordFormScreen.js)
- Formularios: [src/screens/PropietarioFormScreen.js](src/screens/PropietarioFormScreen.js), [src/screens/FiscalFormScreen.js](src/screens/FiscalFormScreen.js), [src/screens/VehicleFormScreen.js](src/screens/VehicleFormScreen.js)

## Contextos y estado

- Auth real: [src/context/AuthContext.js](src/context/AuthContext.js)
- Tema: [src/context/ThemeContext.js](src/context/ThemeContext.js)

`AuthContext` guarda:

- `@auth_token`
- `@auth_user`
- `@active_association_id`

La asociación activa es el contexto real del dominio.

## Servicios activos

Superficies ya conectadas al backend real:

- Auth: [src/services/auth/authService.js](src/services/auth/authService.js)
- SDK dominio: [src/services/api/sdk.js](src/services/api/sdk.js)
- Asociaciones: [src/services/associations/associationService.js](src/services/associations/associationService.js)
- Propietarios: [src/services/propietarios/propietarioService.js](src/services/propietarios/propietarioService.js)
- Fiscales: [src/services/fiscales/fiscalService.js](src/services/fiscales/fiscalService.js)
- Unidades: [src/services/vehicles/vehicleService.js](src/services/vehicles/vehicleService.js)
- Traza: [src/services/traza/trazaService.js](src/services/traza/trazaService.js)

## Convenciones importantes

- Usa `ThemeContext` para colores. No metas paletas hardcoded nuevas salvo que estés alineando una pantalla heredada al resto.
- Usa `responsive.js` para `rf`, `spacing` y `borderRadius`.
- Todo el texto de UI va en español.
- La validación visual principal es mobile-first, no web-first.
- Si cambias una pantalla activa, verifica también el flujo de regreso en `App.js`.

## Pitfalls

- Esta variante mezcla backend real con partes heredadas mock. No asumas que todo dominio está migrado.
- `src/services/api/apiClient.js` tiene `API_BASE_URL` fija. Si la app “falla sola”, revisa eso primero.
- `AuthContext` todavía sintetiza `memberships` sobre un `workshop` mock para compatibilidad con pantallas heredadas. No bases nuevas reglas de negocio en ese mock si puedes usar `activeAssociation`.
- Hay pantallas heredadas de clientes, diagnósticos, órdenes y stock todavía presentes en `src/screens/`, pero no son el flujo principal actual.
- `TeamAccessScreen.js` ya no es la superficie principal para editar la asociación; la pantalla activa es `AssociationSettingsScreen.js`.
- Si tocas invitaciones o membresías, revisa también el backend en `T-SAFV-API`, especialmente modelos de `asociacion`, `invitacion`, `export` y middleware de auth.

## Cómo trabajar aquí

- Para cambios en asociación, propietarios, fiscales, unidades o traza, empieza por las pantallas activas listadas arriba.
- Para reglas de acceso o sesión, empieza por `AuthContext.js` y el backend JWT/API.
- Para validar frontend, ejecuta:

```bash
npx expo export --platform android --output-dir .expo-export-check
```

- Para cambios que dependan del backend, valida también el arranque de `T-SAFV-API`.
