# Tests de regresión: T-SAFV-App-V

Última actualización: 2026-07-30

## Objetivo

Este documento define la suite de tests de regresión para T-SAFV-App-V. Dado que la app actualmente no tiene tests automatizados, este documento sirve como:

1. **Plan de testing manual** para validar cada release
2. **Especificación de tests automatizados** a implementar en el futuro
3. **Checklist de QA** antes de deployment

## Comandos de validación

```bash
# Validar que la app compila
npx expo export --platform android --output-dir .expo-export-check

# Iniciar en emulador Android
npm run android

# Iniciar en simulador iOS
npm run ios
```

## Configuración de entorno de testing

### Backend de prueba

Antes de testear, configurar URL de API de testing en `src/services/api/apiClient.js`:

```js
export const API_BASE_URL = "http://10.0.2.2:3000"; // Android Emulator
// o
export const API_BASE_URL = "http://192.168.1.10:3000"; // Dispositivo físico
```

### Datos de prueba

Usar datos de prueba del backend:

- Email: `test@example.com`
- Password: `Test123456`

---

## Suite de tests manuales

### 1. Tests de Autenticación

#### T-AUTH-APP-001: Login exitoso

**Precondiciones**:

- Backend corriendo
- Usuario test registrado

**Pasos**:

1. Abrir app
2. Ingresar email: `test@example.com`
3. Ingresar password: `Test123456`
4. Tocar "Iniciar Sesión"

**Resultado esperado**:

- App guarda token en AsyncStorage
- App navega a WorkshopHomeScreen
- Header muestra nombre del usuario

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-AUTH-APP-002: Login con credenciales inválidas

**Pasos**:

1. Abrir app
2. Ingresar email: `test@example.com`
3. Ingresar password: `PasswordIncorrecto`
4. Tocar "Iniciar Sesión"

**Resultado esperado**:

- Alert muestra "Email o contraseña incorrectos"
- App permanece en AuthScreen

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-AUTH-APP-003: Registro de nuevo usuario

**Pasos**:

1. Tocar "¿No tienes cuenta? Regístrate"
2. Ingresar nombre: "Usuario Test"
3. Ingresar email: `nuevo@example.com`
4. Ingresar password: `Test123456`
5. Ingresar confirmación: `Test123456`
6. Tocar "Registrarse"

**Resultado esperado**:

- Alert muestra "Registro exitoso"
- App cambia a login
- Usuario puede hacer login con nuevas credenciales

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-AUTH-APP-004: Registro con email duplicado

**Pasos**:

1. Intentar registrar con email ya existente

**Resultado esperado**:

- Alert muestra "El email ya está registrado"

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-AUTH-APP-005: Logout

**Pasos**:

1. Hacer login
2. Navegar a "Más" o "Configuración"
3. Tocar "Cerrar Sesión"

**Resultado esperado**:

- Alert pide confirmación
- App limpia token de AsyncStorage
- App navega a AuthScreen

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-AUTH-APP-006: Persistencia de sesión

**Pasos**:

1. Hacer login
2. Cerrar app completamente
3. Reabrir app

**Resultado esperado**:

- App lee token de AsyncStorage
- App navega directamente a WorkshopHomeScreen (sin mostrar login)

**Resultado real**: ☐ Pass ☐ Fail

---

### 2. Tests de Dashboard

#### T-DASH-APP-001: Cargar resumen de asociación

**Precondiciones**:

- Usuario autenticado
- Usuario pertenece a al menos una asociación

**Pasos**:

1. Hacer login
2. Observar WorkshopHomeScreen

**Resultado esperado**:

- Header muestra nombre de la asociación activa
- Cards muestran:
  - Total de miembros
  - Total de unidades
  - Registros fiscales
  - Estado de licencia
- No hay errores de red

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-DASH-APP-002: Navegación desde Dashboard

**Pasos**:

1. Desde WorkshopHomeScreen, tocar "Ver Propietarios"
2. Verificar navegación a PropietariosScreen
3. Tocar Back, volver a Dashboard
4. Tocar "Ver Fiscales"
5. Verificar navegación a FiscalesScreen

**Resultado esperado**:

- Navegación funciona correctamente
- Back button retorna a Dashboard
- No hay crashes

**Resultado real**: ☐ Pass ☐ Fail

---

### 3. Tests de Propietarios

#### T-PROP-APP-001: Listar propietarios

**Precondiciones**:

- Usuario ADMIN autenticado
- Asociación tiene al menos 1 propietario

**Pasos**:

1. Navegar a PropietariosScreen
2. Observar lista

**Resultado esperado**:

- FlatList muestra propietarios
- Cada item muestra: nombre, email, total de unidades
- Loading indicator desaparece después de cargar

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-PROP-APP-002: Crear propietario (ADMIN)

**Precondiciones**:

- Usuario ADMIN autenticado

**Pasos**:

1. Navegar a PropietariosScreen
2. Tocar "Agregar Propietario"
3. Ingresar nombre: "Nuevo Propietario"
4. Ingresar email: `propietario@example.com`
5. Ingresar password: `Prop123456`
6. Tocar "Crear Propietario"

**Resultado esperado**:

- Alert muestra "Propietario creado"
- App navega atrás a PropietariosScreen
- Lista se recarga y muestra el nuevo propietario

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-PROP-APP-003: Validación de formulario propietario

**Pasos**:

1. Navegar a PropietarioFormScreen
2. Dejar nombre vacío
3. Tocar "Crear Propietario"

**Resultado esperado**:

- Alert muestra "El nombre es requerido"

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-PROP-APP-004: Editar propietario

**Pasos**:

1. Tocar un propietario de la lista
2. Cambiar nombre a "Nombre Actualizado"
3. Tocar "Guardar Cambios"

**Resultado esperado**:

- Alert muestra "Cambios guardados"
- Lista se actualiza con nuevo nombre

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-PROP-APP-005: Botón "Agregar" oculto para no ADMIN

**Precondiciones**:

- Usuario PROPIETARIO o FISCAL autenticado

**Pasos**:

1. Navegar a PropietariosScreen

**Resultado esperado**:

- Botón "Agregar Propietario" NO es visible

**Resultado real**: ☐ Pass ☐ Fail

---

### 4. Tests de Fiscales

#### T-FISC-APP-001: Listar fiscales

**Precondiciones**:

- Usuario autenticado
- Asociación tiene al menos 1 fiscal

**Pasos**:

1. Navegar a FiscalesScreen
2. Observar lista

**Resultado esperado**:

- FlatList muestra fiscales
- Cada item muestra: nombre, email, total de registros

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-FISC-APP-002: Crear fiscal (ADMIN)

**Precondiciones**:

- Usuario ADMIN autenticado

**Pasos**:

1. Navegar a FiscalesScreen
2. Tocar "Agregar Fiscal"
3. Ingresar datos del fiscal
4. Tocar "Crear Fiscal"

**Resultado esperado**:

- Alert muestra "Fiscal creado"
- Lista se recarga con el nuevo fiscal

**Resultado real**: ☐ Pass ☐ Fail

---

### 5. Tests de Unidades

#### T-UNID-APP-001: Crear unidad

**Precondiciones**:

- Usuario ADMIN o PROPIETARIO autenticado
- Existe al menos 1 propietario en la asociación

**Pasos**:

1. Navegar a formulario de unidad
2. Seleccionar propietario
3. Ingresar placa: "ABC-123"
4. Ingresar número de unidad: "U-042"
5. Ingresar puestos: 35
6. Tocar "Guardar Unidad"

**Resultado esperado**:

- Alert muestra "Unidad creada"
- App navega atrás

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-UNID-APP-002: Validación de placa

**Pasos**:

1. Navegar a formulario de unidad
2. Dejar placa vacía
3. Tocar "Guardar Unidad"

**Resultado esperado**:

- Alert muestra "La placa es requerida"

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-UNID-APP-003: Número de unidad duplicado

**Pasos**:

1. Crear unidad con número "U-001"
2. Intentar crear otra unidad con número "U-001"

**Resultado esperado**:

- Alert muestra "El número de unidad ya existe"

**Resultado real**: ☐ Pass ☐ Fail

---

### 6. Tests de Registros Fiscales

#### T-REG-APP-001: Crear registro fiscal (FISCAL)

**Precondiciones**:

- Usuario FISCAL autenticado
- Existe al menos 1 unidad en la asociación

**Pasos**:

1. Navegar a FiscalRecordFormScreen
2. Seleccionar unidad
3. Ingresar pasajeros: 28
4. Ingresar observaciones: "Viaje normal"
5. Tocar "Registrar Fiscalización"

**Resultado esperado**:

- Alert muestra "Registro creado"
- App navega atrás

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-REG-APP-002: PROPIETARIO no puede crear registros

**Precondiciones**:

- Usuario PROPIETARIO autenticado

**Pasos**:

1. Intentar acceder a FiscalRecordFormScreen

**Resultado esperado**:

- Opción NO es visible en menú
- Si se intenta acceder directamente, muestra error de permisos

**Resultado real**: ☐ Pass ☐ Fail

---

### 7. Tests de Trazabilidad

#### T-TRAZA-APP-001: Ver traza de unidad

**Precondiciones**:

- Usuario autenticado
- Existe unidad con al menos 1 registro fiscal

**Pasos**:

1. Navegar a TrazaScreen
2. Seleccionar unidad
3. Observar lista de registros

**Resultado esperado**:

- FlatList muestra registros ordenados por fecha (más reciente primero)
- Cada registro muestra: fecha, fiscal, pasajeros, observaciones
- Resumen muestra total de registros y promedio de pasajeros

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-TRAZA-APP-002: Filtrar por fecha

**Pasos**:

1. En TrazaScreen, ajustar rango de fechas
2. Observar lista filtrada

**Resultado esperado**:

- Solo se muestran registros dentro del rango
- Resumen se actualiza con datos filtrados

**Resultado real**: ☐ Pass ☐ Fail

---

### 8. Tests de Invitaciones

#### T-INV-APP-001: Enviar invitación (ADMIN)

**Precondiciones**:

- Usuario ADMIN autenticado

**Pasos**:

1. Navegar a MemberInvitationsScreen
2. Tocar "Enviar Invitación"
3. Ingresar email: `invitado@example.com`
4. Seleccionar rol: PROPIETARIO
5. Tocar "Enviar"

**Resultado esperado**:

- Alert muestra "Invitación enviada"
- Lista se recarga mostrando nueva invitación con estado "Pendiente"

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-INV-APP-002: Listar invitaciones

**Pasos**:

1. Navegar a MemberInvitationsScreen

**Resultado esperado**:

- FlatList muestra invitaciones enviadas
- Cada item muestra: email, rol, estado, fecha

**Resultado real**: ☐ Pass ☐ Fail

---

### 9. Tests de Configuración

#### T-CONF-APP-001: Editar asociación (ADMIN)

**Precondiciones**:

- Usuario ADMIN autenticado

**Pasos**:

1. Navegar a AssociationSettingsScreen
2. Cambiar nombre a "Asociación Actualizada"
3. Tocar "Guardar Cambios"

**Resultado esperado**:

- Alert muestra "Cambios guardados"
- Header de app muestra nuevo nombre

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-CONF-APP-002: PROPIETARIO no puede editar

**Precondiciones**:

- Usuario PROPIETARIO autenticado

**Pasos**:

1. Intentar acceder a AssociationSettingsScreen

**Resultado esperado**:

- Formulario se muestra en modo solo lectura
- O muestra mensaje "No tienes permisos"

**Resultado real**: ☐ Pass ☐ Fail

---

### 10. Tests de UI y Navegación

#### T-UI-APP-001: Tema claro/oscuro

**Pasos**:

1. Navegar a configuración
2. Alternar tema claro/oscuro
3. Observar cambios en todas las pantallas

**Resultado esperado**:

- Todos los componentes respetan el tema
- Colores cambian correctamente
- Texto es legible en ambos temas

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-UI-APP-002: Responsive en diferentes tamaños

**Pasos**:

1. Probar en dispositivos con diferentes resoluciones:
   - Tablet (10")
   - Teléfono grande (6.5")
   - Teléfono pequeño (5")

**Resultado esperado**:

- Layouts se adaptan correctamente
- Texto es legible (usa rf())
- Botones son alcanzables

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-UI-APP-003: Back button Android

**Pasos**:

1. Navegar a PropietariosScreen
2. Tocar back button de Android
3. Verificar regreso a Dashboard

**Resultado esperado**:

- BackHandler funciona correctamente
- No hay crashes

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-UI-APP-004: Pull to refresh

**Pasos**:

1. En cualquier lista (PropietariosScreen, etc.)
2. Hacer pull down para refrescar

**Resultado esperado**:

- Indicador de refresh aparece
- Lista se recarga con datos actualizados

**Resultado real**: ☐ Pass ☐ Fail

---

### 11. Tests de Errores y Edge Cases

#### T-ERR-APP-001: Sin conexión a internet

**Pasos**:

1. Desactivar WiFi y datos móviles
2. Intentar hacer login

**Resultado esperado**:

- Alert muestra "Sin conexión a internet"

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-ERR-APP-002: Backend no disponible

**Pasos**:

1. Detener T-SAFV-API
2. Intentar operación que requiera backend

**Resultado esperado**:

- Alert muestra mensaje de error amigable
- App no crashea

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-ERR-APP-003: Token expirado

**Pasos**:

1. Hacer login
2. Esperar hasta que token expire (7 días o forzar en backend)
3. Intentar operación autenticada

**Resultado esperado**:

- App detecta 401 del backend
- App limpia token y muestra login

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-ERR-APP-004: Lista vacía

**Pasos**:

1. Navegar a PropietariosScreen sin propietarios

**Resultado esperado**:

- Muestra empty state: "No hay propietarios registrados"
- Muestra botón "Agregar Propietario"

**Resultado real**: ☐ Pass ☐ Fail

---

### 12. Tests de Performance

#### T-PERF-APP-001: Scroll de lista larga

**Precondiciones**:

- Lista con 100+ items

**Pasos**:

1. Hacer scroll rápido

**Resultado esperado**:

- Scroll es fluido (60 FPS)
- No hay lag ni stuttering

**Resultado real**: ☐ Pass ☐ Fail

---

#### T-PERF-APP-002: Tiempo de carga de pantallas

**Pasos**:

1. Medir tiempo desde tap hasta render completo

**Resultado esperado**:

- < 500ms para pantallas simples
- < 2s para pantallas con fetch de datos

**Resultado real**: ☐ Pass ☐ Fail

---

## Checklist de Pre-Release

Antes de cada release, verificar:

- [ ] Todos los tests de autenticación pasan
- [ ] Todos los tests de CRUD pasan
- [ ] Navegación funciona correctamente
- [ ] BackHandler funciona en Android
- [ ] Tema claro/oscuro funciona
- [ ] Pull to refresh funciona
- [ ] Loading states se muestran
- [ ] Mensajes de error son claros
- [ ] App no crashea con backend apagado
- [ ] App compila sin warnings: `npx expo export --platform android`
- [ ] App funciona en emulador Android
- [ ] App funciona en dispositivo físico Android
- [ ] App funciona en simulador iOS (si aplica)

---

## Plan de Testing Automatizado (Futuro)

### Stack recomendado

- **Jest**: Framework de testing
- **React Native Testing Library**: Testing de componentes
- **Detox**: Tests E2E
- **Mock Service Worker**: Mockear API

### Estructura propuesta

```
__tests__/
├── unit/
│   ├── utils/
│   │   ├── responsive.test.js
│   │   └── dateRange.test.js
│   ├── services/
│   │   ├── authService.test.js
│   │   ├── propietarioService.test.js
│   │   └── fiscalService.test.js
│   └── context/
│       ├── AuthContext.test.js
│       └── ThemeContext.test.js
├── integration/
│   ├── screens/
│   │   ├── PropietariosScreen.test.js
│   │   ├── FiscalesScreen.test.js
│   │   └── TrazaScreen.test.js
│   └── flows/
│       ├── login.flow.test.js
│       ├── createPropietario.flow.test.js
│       └── createRegistro.flow.test.js
└── e2e/
    ├── auth.e2e.js
    ├── propietarios.e2e.js
    └── fiscales.e2e.js
```

### Ejemplo de test unitario

```js
// __tests__/unit/services/authService.test.js
import { authService } from "../../../src/services/auth/authService";

jest.mock("../../../src/services/api/apiClient");

describe("authService", () => {
  it("should login successfully", async () => {
    const result = await authService.apiLogin("test@example.com", "Pass123");
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });

  it("should throw error on invalid credentials", async () => {
    await expect(
      authService.apiLogin("test@example.com", "WrongPass"),
    ).rejects.toThrow("Credenciales inválidas");
  });
});
```

### Ejemplo de test de integración

```js
// __tests__/integration/screens/PropietariosScreen.test.js
import { render, waitFor } from "@testing-library/react-native";
import PropietariosScreen from "../../../src/screens/PropietariosScreen";

describe("PropietariosScreen", () => {
  it("should render list of propietarios", async () => {
    const { getByText } = render(<PropietariosScreen />);

    await waitFor(() => {
      expect(getByText("Juan Pérez")).toBeTruthy();
    });
  });

  it("should show empty state when no propietarios", async () => {
    // Mock service to return empty array
    const { getByText } = render(<PropietariosScreen />);

    await waitFor(() => {
      expect(getByText("No hay propietarios registrados")).toBeTruthy();
    });
  });
});
```

### Ejemplo de test E2E con Detox

```js
// __tests__/e2e/auth.e2e.js
describe("Authentication Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should login successfully", async () => {
    await element(by.id("email-input")).typeText("test@example.com");
    await element(by.id("password-input")).typeText("Test123456");
    await element(by.id("login-button")).tap();

    await expect(element(by.text("Dashboard"))).toBeVisible();
  });
});
```

---

## Cobertura esperada

| Tipo              | Cobertura mínima                                           |
| ----------------- | ---------------------------------------------------------- |
| Unit tests        | 70%                                                        |
| Integration tests | 60%                                                        |
| E2E tests         | Flujos críticos (login, crear propietario, crear registro) |

---

## CI/CD Integration

```yaml
# .github/workflows/test-app.yml
name: Test App
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm run test
      - run: npx expo export --platform android
```

---

## Referencias

- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura del sistema
- [SPECS.md](./SPECS.md) - Especificaciones funcionales
- [../T-SAFV-API/TESTS_REGRESION.md](../T-SAFV-API/TESTS_REGRESION.md) - Tests backend
- Jest: https://jestjs.io/
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- Detox: https://wix.github.io/Detox/
