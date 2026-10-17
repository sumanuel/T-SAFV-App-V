# T-SAFV-App-V — Arranque Rápido

Última actualización: 2026-10-17

## Stack

- Expo SDK 57, React 19, React Native 0.86.
- Autenticación JWT contra **T-SAFV-API**; sin Firebase para datos (Firebase solo se usa para FCM/push en Android).
- Token JWT en `expo-secure-store`; usuario y asociación activa en AsyncStorage.
- Axios en auth y `fetch` envuelto en `src/services/api/sdk.js` para el resto del dominio.

## URL de la API

Se define en `src/services/api/apiClient.js` (`API_BASE_URL`). Por defecto apunta a producción
(`https://t-safv.system-meek.com`). Para desarrollo local cámbiala temporalmente:

```js
// Emulador Android
export const API_BASE_URL = "http://10.0.2.2:3000";

// Dispositivo físico (misma red WiFi)
export const API_BASE_URL = "http://192.168.1.10:3000";

// iOS Simulator
export const API_BASE_URL = "http://localhost:3000";
```

## Instalación y desarrollo

```bash
npm install
npm run start          # expo start (dev client; en Expo Go no hay push)
npm run android        # expo start --android
```

## Validar bundle

```bash
npx expo export --platform android --output-dir .expo-export-check
```

No hay suite de tests ni lint configurados todavía (ver [MEJORAS.md](MEJORAS.md)).

## Builds (EAS)

```bash
eas build --profile development --platform android
```

- `google-services.json` no está en git: EAS lo inyecta con la variable de entorno `GOOGLE_SERVICES_JSON` (ver `app.config.js`).
- Cambios en íconos, splash o módulos nativos solo se ven tras un build nuevo.

## Estructura

```
App.js                    # Navegación manual por estado (activeScreen) + BackHandler
src/
  context/                # AuthContext (sesión, asociaciones), ThemeContext
  constants/accessControl.js
  utils/                  # responsive.js, dateRange.js, logger.js
  services/
    api/                  # apiClient.js (axios), sdk.js (fetch de dominio)
    auth/                 # authService, tokenStorage (SecureStore), sessionExpiry
    associations/ propietarios/ fiscales/ vehicles/ traza/
    notifications/        # notificaciones in-app y push
    security/             # bloqueo biométrico
  components/common/      # Header, TabBar, ErrorBoundary, filtros, métricas
  screens/                # Pantallas activas del dominio
```

Para el detalle de pantallas activas y convenciones, ver [AGENTS.md](AGENTS.md) y [ARQUITECTURA.md](ARQUITECTURA.md).
