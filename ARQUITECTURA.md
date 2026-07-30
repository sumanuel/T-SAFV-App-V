# Arquitectura: T-SAFV-App-V

Última actualización: 2026-07-30

## Resumen de arquitectura

T-SAFV-App-V es una aplicación móvil React Native construida con Expo que implementa una arquitectura basada en contextos, servicios y navegación manual. Consume datos de T-SAFV-API vía HTTP y persiste estado de autenticación en AsyncStorage.

## Diagrama de componentes

```
┌────────────────────────────────────────────────────────────┐
│                     Mobile Device                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                    App.js                            │ │
│  │  • Navegación manual (activeScreen state)           │ │
│  │  • BackHandler control                              │ │
│  │  • Tab bar rendering                                │ │
│  └─────────────────┬────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼────────────────────────────────────┐ │
│  │ Providers       │                                    │ │
│  │ • AuthProvider  │                                    │ │
│  │ • ThemeProvider │                                    │ │
│  └─────────────────┼────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼────────────────────────────────────┐ │
│  │ Screens Layer   │                                    │ │
│  │ • WorkshopHomeScreen                                │ │
│  │ • PropietariosScreen                                │ │
│  │ • FiscalesScreen                                    │ │
│  │ • TrazaScreen                                       │ │
│  │ • MemberInvitationsScreen                           │ │
│  │ • AssociationSettingsScreen                         │ │
│  │ • Form screens (Propietario, Fiscal, Vehicle, etc.) │ │
│  └─────────────────┼────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼────────────────────────────────────┐ │
│  │ Services Layer  │                                    │ │
│  │ • authService                                       │ │
│  │ • associationService                                │ │
│  │ • propietarioService                                │ │
│  │ • fiscalService                                     │ │
│  │ • vehicleService                                    │ │
│  │ • trazaService                                      │ │
│  └─────────────────┼────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼────────────────────────────────────┐ │
│  │ HTTP Layer      │                                    │ │
│  │ • apiClient.js (Axios with JWT interceptor)        │ │
│  │ • sdk.js (Fetch wrapper)                           │ │
│  └─────────────────┼────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼────────────────────────────────────┐ │
│  │ Storage         │                                    │ │
│  │ • AsyncStorage (@auth_token, @auth_user, etc.)     │ │
│  └─────────────────┼────────────────────────────────────┘ │
└────────────────────┼──────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   T-SAFV-API         │
          │   (Express/PostgreSQL)│
          └──────────────────────┘
```

## Estructura de directorios

```
T-SAFV-App-V/
├── App.js                              # Raíz de la app
├── index.js                            # Entry point (registerRootComponent)
├── src/
│   ├── context/
│   │   ├── AuthContext.js              # Auth + asociación activa
│   │   └── ThemeContext.js             # Tema claro/oscuro
│   ├── constants/
│   │   └── accessControl.js            # Roles, permisos (heredado)
│   ├── utils/
│   │   ├── responsive.js               # rf(), spacing, borderRadius
│   │   └── dateRange.js                # Utilidades de fechas
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.js            # Axios client
│   │   │   └── sdk.js                  # Fetch wrapper
│   │   ├── auth/
│   │   │   └── authService.js          # Login/Register
│   │   ├── associations/
│   │   │   └── associationService.js   # CRUD asociaciones
│   │   ├── propietarios/
│   │   │   └── propietarioService.js   # CRUD propietarios
│   │   ├── fiscales/
│   │   │   └── fiscalService.js        # CRUD fiscales
│   │   ├── vehicles/
│   │   │   └── vehicleService.js       # CRUD unidades
│   │   └── traza/
│   │       └── trazaService.js         # Trazabilidad
│   ├── screens/
│   │   ├── WorkshopHomeScreen.js       # Dashboard
│   │   ├── PropietariosScreen.js
│   │   ├── PropietarioFormScreen.js
│   │   ├── FiscalesScreen.js
│   │   ├── FiscalFormScreen.js
│   │   ├── VehicleFormScreen.js
│   │   ├── FiscalRecordFormScreen.js
│   │   ├── TrazaScreen.js
│   │   ├── MemberInvitationsScreen.js
│   │   ├── AssociationSettingsScreen.js
│   │   └── ... (pantallas heredadas)
│   └── components/
│       └── common/
│           └── ...
└── package.json
```

## Capas y responsabilidades

### 1. Capa de Navegación (App.js)

**Responsabilidad**: Controlar la navegación entre pantallas sin React Navigation.

**Patrón**:

```js
const [activeScreen, setActiveScreen] = useState("home");
const [navigationContext, setNavigationContext] = useState({});

const navigation = {
  navigate: (screen, params = {}) => {
    setActiveScreen(screen);
    setNavigationContext(params);
  },
  goBack: () => {
    // Lógica de retorno manual
  },
};

// Renderizado condicional
{
  activeScreen === "home" && <WorkshopHomeScreen navigation={navigation} />;
}
{
  activeScreen === "propietarios" && (
    <PropietariosScreen navigation={navigation} />
  );
}
```

**Gestión de BackHandler**:

```js
useEffect(() => {
  const backAction = () => {
    if (activeScreen === "home") {
      Alert.alert("Salir", "¿Deseas salir de la aplicación?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    } else {
      navigation.goBack();
      return true;
    }
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction,
  );
  return () => backHandler.remove();
}, [activeScreen]);
```

### 2. Capa de Contextos

**Responsabilidad**: Proveer estado global (auth, tema) a toda la app.

#### AuthContext

**Estado**:

```js
{
  isAuthenticated: boolean,
  user: { id, nombre, email },
  token: string,
  activeAssociation: { id, nombre, rif, ... },
  memberships: Array<Membership> // Mock actualmente
}
```

**Funciones**:

```js
login(email, password); // → Llama a authService.apiLogin()
register(nombre, email, password);
logout();
setActiveAssociation(association);
refreshUser(); // Re-fetch de user data
```

**Persistencia**:

- `@auth_token`: JWT token
- `@auth_user`: Objeto de usuario serializado
- `@active_association_id`: ID de asociación activa

#### ThemeContext

**Estado**:

```js
{
  isDarkMode: boolean,
  theme: {
    background: "#FFFFFF" | "#1A1A1A",
    card: "#F5F5F5" | "#2A2A2A",
    text: "#000000" | "#FFFFFF",
    primary: "#007AFF",
    secondary: "#5856D6",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    border: "#E5E5E5" | "#3A3A3A"
  }
}
```

**Funciones**:

```js
toggleTheme(); // Alterna entre claro/oscuro
```

### 3. Capa de Pantallas (Screens)

**Responsabilidad**: Renderizar UI, manejar eventos de usuario, llamar a servicios.

**Patrón típico**:

```js
function PropietariosScreen({ navigation }) {
  const { activeAssociation } = useAuth();
  const { theme } = useTheme();
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPropietarios();
  }, []);

  const loadPropietarios = async () => {
    try {
      setLoading(true);
      const data = await propietarioService.list(activeAssociation.id);
      setPropietarios(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={propietarios}
          renderItem={({ item }) => <PropietarioCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
}
```

### 4. Capa de Servicios

**Responsabilidad**: Encapsular lógica de comunicación con API y transformación de datos.

**Patrón**:

```js
// propietarioService.js
import { sdk } from "../api/sdk";

export const propietarioService = {
  list: async (associationId) => {
    const response = await sdk.fetchPropietarios(associationId);
    return response;
  },

  create: async (data) => {
    const response = await sdk.createPropietario(data);
    return response;
  },

  update: async (id, data) => {
    const response = await sdk.updatePropietario(id, data);
    return response;
  },

  delete: async (id) => {
    await sdk.deletePropietario(id);
  },
};
```

### 5. Capa HTTP

**Responsabilidad**: Gestionar comunicación HTTP con backend.

#### apiClient.js (Axios)

```js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "http://10.0.2.2:3000"; // Configurar según entorno

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adjuntar JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("@auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - logout
      AsyncStorage.multiRemove(["@auth_token", "@auth_user"]);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

#### sdk.js (Fetch wrapper)

```js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiClient";

async function request(endpoint, options = {}) {
  const token = await AsyncStorage.getItem("@auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error en la solicitud");
  }

  return response.json();
}

export const sdk = {
  // Asociaciones
  fetchAssociations: () => request("/api/asociaciones/mine"),
  fetchAssociationSummary: (id) => request(`/api/asociaciones/${id}/resumen`),
  updateAssociation: (id, data) =>
    request(`/api/asociaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Propietarios
  fetchPropietarios: (associationId) =>
    request(`/api/propietario/asociacion/${associationId}`),
  createPropietario: (data) =>
    request(`/api/asociaciones/${data.asociacion_id}/miembros`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Fiscales
  fetchFiscales: (associationId) =>
    request(`/api/fiscal/asociacion/${associationId}`),

  // Unidades
  fetchUnidades: (associationId) =>
    request(`/api/unidades/asociaciones/${associationId}/unidades`),
  createUnidad: (associationId, data) =>
    request(`/api/unidades/asociaciones/${associationId}/unidades`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Registros fiscales
  fetchRegistrosFiscales: (associationId, filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request(
      `/api/fiscal/registros/asociacion/${associationId}?${query}`,
    );
  },
  createRegistroFiscal: (data) =>
    request("/api/fiscal/registros", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Invitaciones
  fetchInvitations: (associationId) =>
    request(`/api/invitaciones/asociacion/${associationId}`),
  createInvitation: (data) =>
    request("/api/invitaciones", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  acceptInvitation: (token) =>
    request(`/api/invitaciones/${token}/aceptar`, {
      method: "POST",
    }),

  // Traza
  fetchTraza: (unidadId) => request(`/api/unidades/${unidadId}/traza`),
};
```

### 6. Capa de Persistencia (AsyncStorage)

**Responsabilidad**: Persistir estado entre sesiones de la app.

**Claves almacenadas**:

- `@auth_token`: JWT token
- `@auth_user`: Usuario serializado como JSON
- `@active_association_id`: ID de asociación activa
- `@onboarding_completed`: Flag de onboarding

**Patrón de uso**:

```js
// Guardar
await AsyncStorage.setItem("@auth_token", token);
await AsyncStorage.setItem("@auth_user", JSON.stringify(user));

// Leer
const token = await AsyncStorage.getItem("@auth_token");
const userString = await AsyncStorage.getItem("@auth_user");
const user = userString ? JSON.parse(userString) : null;

// Eliminar
await AsyncStorage.removeItem("@auth_token");

// Eliminar múltiples
await AsyncStorage.multiRemove(["@auth_token", "@auth_user"]);
```

## Flujos de datos

### Flujo de autenticación

```
Usuario ingresa credenciales
  ↓
AuthScreen → handleLogin()
  ↓
AuthContext.login(email, password)
  ↓
authService.apiLogin(email, password)
  ↓
POST /api/auth/login
  ↓
API retorna { token, user }
  ↓
Guardar en AsyncStorage
  ├─ @auth_token
  └─ @auth_user
  ↓
Actualizar estado de AuthContext
  ├─ isAuthenticated = true
  ├─ user = userData
  └─ token = jwtToken
  ↓
App.js re-renderiza → muestra WorkshopHomeScreen
```

### Flujo de creación de propietario

```
Admin navega a PropietariosScreen
  ↓
Toca "Agregar Propietario"
  ↓
navigation.navigate("propietario-form")
  ↓
App.js renderiza PropietarioFormScreen
  ↓
Usuario llena formulario
  ↓
handleSubmit()
  ↓
propietarioService.create({ nombre, email, password, rol })
  ↓
sdk.createPropietario(data)
  ↓
POST /api/asociaciones/:id/miembros
  ↓
API crea usuario + membresía
  ↓
Retorna nuevo propietario
  ↓
Alert.alert("Éxito", "Propietario creado")
  ↓
navigation.goBack()
  ↓
PropietariosScreen → recargar lista
```

### Flujo de registro fiscal

```
Fiscal navega a FiscalRecordFormScreen
  ↓
Selecciona unidad
  ↓
Ingresa pasajeros y observaciones
  ↓
handleSubmit()
  ↓
fiscalService.createRecord({ unidad_id, asociacion_id, pasajeros, obs })
  ↓
sdk.createRegistroFiscal(data)
  ↓
POST /api/fiscal/registros
  ↓
API crea registro
  ↓
Retorna registro creado
  ↓
Alert.alert("Éxito", "Registro creado")
  ↓
navigation.goBack()
```

## Patrones de UI

### Loading states

```js
{
  loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  ) : (
    <RenderContent />
  );
}
```

### Empty states

```js
{data.length === 0 ? (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, { color: theme.text }]}>
      No hay propietarios registrados
    </Text>
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.primary }]}
      onPress={() => navigation.navigate("propietario-form")}
    >
      <Text style={styles.buttonText}>Agregar Propietario</Text>
    </TouchableOpacity>
  </View>
) : (
  <FlatList data={data} ... />
)}
```

### Error handling

```js
try {
  await someService.someMethod();
  Alert.alert("Éxito", "Operación completada");
} catch (error) {
  Alert.alert("Error", error.message || "Algo salió mal");
}
```

### Form validation

```js
const handleSubmit = async () => {
  if (!nombre.trim()) {
    Alert.alert("Error", "El nombre es requerido");
    return;
  }

  if (!email.trim() || !isValidEmail(email)) {
    Alert.alert("Error", "Email inválido");
    return;
  }

  if (password.length < 8) {
    Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres");
    return;
  }

  // Procesar formulario
  setLoading(true);
  try {
    await propietarioService.create({ nombre, email, password });
    Alert.alert("Éxito", "Propietario creado");
    navigation.goBack();
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};
```

## Manejo de errores

### Errores de red

```js
try {
  const data = await propietarioService.list(associationId);
} catch (error) {
  if (error.message.includes("Network request failed")) {
    Alert.alert("Sin conexión", "Verifica tu conexión a internet");
  } else {
    Alert.alert("Error", error.message);
  }
}
```

### Errores de autenticación (401)

Manejado automáticamente en `apiClient.js` interceptor:

```js
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.multiRemove(["@auth_token", "@auth_user"]);
      // El AuthContext detectará la ausencia de token y mostrará login
    }
    return Promise.reject(error);
  },
);
```

## Responsividad

Usar helpers de `responsive.js`:

```js
import { rf, spacing, borderRadius } from "../utils/responsive";

const styles = StyleSheet.create({
  title: {
    fontSize: rf(20), // Escalado responsive
    marginBottom: spacing.md, // 16
    borderRadius: borderRadius.lg, // 16
  },
});
```

## Tema y diseño

### Obtener colores del tema

```js
import { useTheme } from "../context/ThemeContext";

function MyComponent() {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hola</Text>
    </View>
  );
}
```

### Colores semánticos

- `theme.primary`: Acciones principales (botones, links)
- `theme.success`: Operaciones exitosas
- `theme.warning`: Advertencias
- `theme.danger`: Errores, eliminaciones
- `theme.text`: Texto principal
- `theme.textSecondary`: Texto secundario
- `theme.border`: Bordes de cards, inputs

## Performance

### Optimización de listas

```js
<FlatList
  data={propietarios}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

### Memoización de componentes

```js
const PropietarioCard = React.memo(({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <Text>{item.nombre}</Text>
    </TouchableOpacity>
  );
});
```

## Seguridad

### No exponer tokens en logs

```js
// MAL
console.log("Token:", token);

// BIEN
console.log("Token presente:", !!token);
```

### Validar inputs

```js
const sanitizeInput = (text) => text.trim().replace(/<[^>]*>/g, "");
```

## Testing

Actualmente no hay suite de tests. Ver [TESTS_REGRESION.md](./TESTS_REGRESION.md) para plan de testing.

## Deployment

Ver [ARRANQUE_RAPIDO.md](./ARRANQUE_RAPIDO.md) para comandos de build y export.

## Referencias

- [CONTEXTO_PROYECTO.md](./CONTEXTO_PROYECTO.md) - Contexto general
- [SPECS.md](./SPECS.md) - Especificaciones funcionales
- [TESTS_REGRESION.md](./TESTS_REGRESION.md) - Tests de regresión
- [../T-SAFV-API/ARQUITECTURA.md](../T-SAFV-API/ARQUITECTURA.md) - Arquitectura backend
