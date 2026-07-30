# Contexto del proyecto: T-SAFV-App-V

Última actualización: 2026-07-30

## Resumen rápido

T-SAFV-App-V es la aplicación móvil React Native del ecosistema T-SAFV, diseñada para la gestión operativa de asociaciones de transporte. Permite administrar propietarios, fiscales, unidades vehiculares, registros de fiscalización, invitaciones y trazabilidad desde dispositivos móviles.

## Stack y arquitectura

- **Framework**: Expo SDK 54
- **Runtime**: React 19, React Native 0.81
- **Lenguaje**: JavaScript (sin TypeScript)
- **Autenticación**: JWT vía T-SAFV-API
- **Persistencia**: AsyncStorage para token y usuario
- **Navegación**: Manual (sin React Navigation), controlada por estado en App.js
- **Comunicación**: Axios + fetch (SDK unificado en `src/services/api/sdk.js`)

## Propósito del proyecto

T-SAFV-App-V es la interfaz móvil para:

1. **Administradores**: Gestionar asociación, miembros, invitaciones, unidades
2. **Propietarios**: Ver y gestionar sus unidades
3. **Fiscales**: Registrar fiscalizaciones de unidades en operación

La app conecta con **T-SAFV-API** para todas las operaciones de datos reales y mantiene compatibilidad con datos mock para desarrollo sin backend.

## Arquitectura de navegación

La navegación NO usa React Navigation. Todo se maneja manualmente en **App.js**:

```js
const [activeScreen, setActiveScreen] = useState("home");
const [navigationContext, setNavigationContext] = useState({});
```

**Pantallas activas principales**:

- `WorkshopHomeScreen`: Dashboard principal
- `PropietariosScreen`: Lista de propietarios
- `FiscalesScreen`: Lista de fiscales
- `TrazaScreen`: Trazabilidad de unidades
- `MemberInvitationsScreen`: Gestión de invitaciones
- `AssociationSettingsScreen`: Datos de la asociación
- `PropietarioFormScreen`, `FiscalFormScreen`, `VehicleFormScreen`: Formularios
- `FiscalRecordFormScreen`: Registro de fiscalización

El retorno entre pantallas también se maneja manualmente en **App.js** con `BackHandler`.

## Módulos funcionales principales

### 1. Autenticación

- Login/Register vía `src/services/auth/authService.js`
- Token JWT guardado en AsyncStorage (`@auth_token`)
- Usuario guardado en AsyncStorage (`@auth_user`)
- Asociación activa guardada en AsyncStorage (`@active_association_id`)

### 2. Asociaciones

- Listar asociaciones del usuario: `GET /api/asociaciones/mine`
- Actualizar asociación: `PUT /api/asociaciones/:id`
- Ver resumen operativo: `GET /api/asociaciones/:id/resumen`
- Servicio: `src/services/associations/associationService.js`

### 3. Propietarios

- Listar propietarios de la asociación
- Crear/editar propietarios
- Ver unidades del propietario
- Pantalla: `PropietariosScreen.js`, `PropietarioFormScreen.js`

### 4. Fiscales

- Listar fiscales de la asociación
- Crear/editar fiscales
- Ver registros del fiscal
- Pantalla: `FiscalesScreen.js`, `FiscalFormScreen.js`

### 5. Unidades

- Crear/editar unidades vehiculares
- Asignar a propietario
- Ver detalles de unidad
- Pantalla: `VehicleFormScreen.js`

### 6. Registros Fiscales

- Crear registro de fiscalización
- Ver historial de registros
- Filtrar por unidad o fiscal
- Pantalla: `FiscalRecordFormScreen.js`

### 7. Trazabilidad

- Ver historial completo de una unidad
- Filtrar por fechas
- Exportar datos
- Pantalla: `TrazaScreen.js`

### 8. Invitaciones

- Enviar invitaciones a nuevos miembros
- Ver invitaciones pendientes
- Aceptar/rechazar invitaciones
- Pantalla: `MemberInvitationsScreen.js`

## Estructura del proyecto

```
T-SAFV-App-V/
├── App.js                          # Punto de entrada, navegación manual
├── index.js                        # Registro del componente raíz
├── src/
│   ├── context/
│   │   ├── AuthContext.js          # Auth JWT + asociación activa
│   │   └── ThemeContext.js         # Tema claro/oscuro
│   ├── constants/
│   │   └── accessControl.js        # Roles y permisos (heredado)
│   ├── utils/
│   │   ├── responsive.js           # rf(), spacing, borderRadius
│   │   └── dateRange.js            # Utilidades de fechas
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.js        # Axios client con JWT interceptor
│   │   │   └── sdk.js              # SDK unificado (fetch wrapper)
│   │   ├── auth/
│   │   │   └── authService.js      # apiLogin(), apiRegister()
│   │   ├── associations/
│   │   │   └── associationService.js
│   │   ├── propietarios/
│   │   │   └── propietarioService.js
│   │   ├── fiscales/
│   │   │   └── fiscalService.js
│   │   ├── vehicles/
│   │   │   └── vehicleService.js
│   │   └── traza/
│   │       └── trazaService.js
│   ├── screens/
│   │   ├── WorkshopHomeScreen.js   # Dashboard
│   │   ├── PropietariosScreen.js
│   │   ├── PropietarioFormScreen.js
│   │   ├── FiscalesScreen.js
│   │   ├── FiscalFormScreen.js
│   │   ├── VehicleFormScreen.js
│   │   ├── FiscalRecordFormScreen.js
│   │   ├── TrazaScreen.js
│   │   ├── MemberInvitationsScreen.js
│   │   ├── AssociationSettingsScreen.js
│   │   └── ...
│   └── components/
│       └── common/
│           └── ...
├── AGENTS.md
├── ARRANQUE_RAPIDO.md
└── package.json
```

## Contextos y estado global

### AuthContext (`src/context/AuthContext.js`)

**Estado**:

- `isAuthenticated`: boolean
- `user`: objeto de usuario
- `token`: JWT token
- `activeAssociation`: asociación activa
- `memberships`: lista de membresías (actualmente mock)

**Funciones**:

- `login(email, password)`: Autenticación vía API
- `register(nombre, email, password)`: Registro vía API
- `logout()`: Limpia token y usuario de AsyncStorage
- `setActiveAssociation(association)`: Cambia asociación activa

### ThemeContext (`src/context/ThemeContext.js`)

**Estado**:

- `isDarkMode`: boolean
- `theme`: objeto con colores del tema activo

**Funciones**:

- `toggleTheme()`: Alterna entre claro/oscuro

## Servicios clave

### apiClient.js

Cliente Axios con:

- Interceptor para adjuntar JWT en headers
- Base URL configurable (`API_BASE_URL`)
- Timeout de 10 segundos

### sdk.js

SDK unificado con fetch para:

- `fetchAssociations()`
- `fetchPropietarios(associationId)`
- `fetchFiscales(associationId)`
- `fetchUnidades(associationId)`
- `createPropietario(data)`
- `createFiscal(data)`
- `createUnidad(data)`
- `createFiscalRecord(data)`
- etc.

## Convenciones de UI

### Diseño

- **Responsive**: Usar `rf()` de `responsive.js` para escalado de fuentes
- **Espaciado**: Usar `spacing` de `responsive.js` (8, 12, 16, 20, 24)
- **Bordes**: Usar `borderRadius` de `responsive.js` (8, 12, 16)
- **Tema**: Obtener colores de `ThemeContext`, no hardcoded
- **Idioma**: Todo en español

### Componentes

- **Cards**: Contenedores con sombra, bordes redondeados, fondo blanco/gris oscuro
- **Botones**: TouchableOpacity con estilo consistente, estados disabled
- **Inputs**: TextInput con bordes, placeholders claros, validación visual
- **Listas**: FlatList con `keyExtractor`, `ItemSeparatorComponent`
- **Empty states**: Mensaje + icono cuando no hay datos

### Estados de carga

- Usar `ActivityIndicator` centralizado
- Deshabilitar botones durante operaciones
- Mensajes de feedback con `Alert.alert()`

## Flujo de datos

### Flujo típico de pantalla

```
Usuario toca botón
  ↓
onPress handler
  ↓
Llamada a servicio (ej: propietarioService.create())
  ↓
Servicio llama SDK (fetch a API)
  ↓
API retorna datos
  ↓
Actualizar estado local (useState)
  ↓
Re-render de UI
```

### Ejemplo: Crear propietario

```js
// PropietarioFormScreen.js
const handleSubmit = async () => {
  setLoading(true);
  try {
    const result = await propietarioService.create({
      nombre,
      email,
      password,
      rol: "PROPIETARIO",
    });

    Alert.alert("Éxito", "Propietario creado");
    navigation.goBack();
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};
```

## Integración con T-SAFV-API

### URL de la API

Configurar en `src/services/api/apiClient.js`:

```js
// Android Emulator
export const API_BASE_URL = "http://10.0.2.2:3000";

// iOS Simulator
export const API_BASE_URL = "http://localhost:3000";

// Dispositivo físico (misma red WiFi)
export const API_BASE_URL = "http://192.168.1.10:3000";

// Producción
export const API_BASE_URL = "https://api.t-safv.com";
```

### Headers de autenticación

Todos los requests autenticados incluyen:

```
Authorization: Bearer <JWT_TOKEN>
```

Esto se maneja automáticamente en `apiClient.js` interceptor.

## Roles y permisos

Los roles se heredan del backend:

- **ADMIN**: Acceso completo a la asociación
- **PROPIETARIO**: Ver/editar sus unidades
- **FISCAL**: Registrar fiscalizaciones

La validación de permisos se hace en backend. El frontend solo oculta/muestra elementos según el rol del usuario.

## Comandos útiles

```bash
# Instalación
npm install

# Desarrollo
npm run start          # Expo start
npm run android        # Expo Android
npm run ios            # Expo iOS

# Validación de bundle
npx expo export --platform android --output-dir .expo-export-check
```

## Estado actual y notas operativas

- La app combina backend real (asociaciones, propietarios, fiscales, unidades, traza) con partes heredadas mock (clientes, diagnósticos, órdenes de trabajo, stock).
- Las pantallas activas del dominio actual son las listadas en **AGENTS.md**.
- `AuthContext` todavía sintetiza `memberships` sobre un `workshop` mock para compatibilidad con pantallas heredadas. No basar nuevas reglas de negocio en ese mock.
- Hay pantallas heredadas de clientes, diagnósticos, órdenes y stock todavía presentes en `src/screens/`, pero no son el flujo principal actual.

## Riesgos o deuda visible

- **Navegación manual**: Sin React Navigation, el código de navegación en App.js puede volverse difícil de mantener si crece mucho.
- **URL hardcoded**: `API_BASE_URL` fija en `apiClient.js`. Considerar variable de entorno.
- **Mock vs Real**: Partes heredadas mock pueden confundir. Documentar claramente qué es mock y qué es real.
- **Sin TypeScript**: Más propenso a errores de tipos. Considerar migración gradual.
- **Sin tests**: No hay suite de tests. Validación manual solamente.

## Recomendación para futuras sesiones

Antes de tocar una pantalla o flujo:

1. Leer el código de la pantalla en `src/screens/`
2. Verificar qué servicio usa (mock o real)
3. Revisar el contrato con backend en `T-SAFV-API/MATRIZ_APP_BACKEND.md`
4. Confirmar que la URL de API está configurada correctamente
5. Probar en emulador/dispositivo físico antes de commit

## Coordinación con backend

**Contrato crítico** (ver [MATRIZ_APP_BACKEND.md](../T-SAFV-API/MATRIZ_APP_BACKEND.md)):

- No cambiar enums de estado/rol sin sincronizar con backend
- No cambiar validaciones de campos sin actualizar formularios
- Mantener MATRIZ sincronizada en ambos repos
- Si cambia un endpoint de backend, actualizar SDK y pantallas relacionadas

## Referencias relacionadas

- **Backend**: `../T-SAFV-API/CONTEXTO_PROYECTO.md`
- **Setup**: [ARRANQUE_RAPIDO.md](./ARRANQUE_RAPIDO.md)
- **Arquitectura**: [ARQUITECTURA.md](./ARQUITECTURA.md)
- **Especificaciones**: [SPECS.md](./SPECS.md)
- **Tests**: [TESTS_REGRESION.md](./TESTS_REGRESION.md)
