jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function mockSecureStore({ available = true, importFails = false } = {}) {
  const store = new Map();
  jest.doMock("expo-secure-store", () => {
    if (importFails) throw new Error("Cannot find native module 'ExpoSecureStore'");
    return {
      isAvailableAsync: async () => available,
      getItemAsync: async (key) => store.get(key) ?? null,
      setItemAsync: async (key, value) => void store.set(key, value),
      deleteItemAsync: async (key) => void store.delete(key),
    };
  });
  return store;
}

// tokenStorage guarda el modulo cargado en una variable de modulo, asi que
// cada prueba necesita su propio registro; AsyncStorage debe salir del mismo.
function load() {
  let loaded;
  jest.isolateModules(() => {
    loaded = {
      ...require("../../src/services/auth/tokenStorage"),
      AsyncStorage: require("@react-native-async-storage/async-storage"),
    };
  });
  return loaded;
}

beforeEach(() => {
  jest.resetModules();
  jest.dontMock("expo-secure-store");
});

describe("con SecureStore disponible", () => {
  it("guarda el token cifrado y no deja copia en AsyncStorage", async () => {
    const store = mockSecureStore();
    const { setToken, getToken, AsyncStorage } = load();

    await setToken("abc");

    expect(store.get("auth_token")).toBe("abc");
    expect(await AsyncStorage.getItem("@auth_token")).toBeNull();
    expect(await getToken()).toBe("abc");
  });

  it("migra un token legado de AsyncStorage y lo borra de ahi", async () => {
    const store = mockSecureStore();
    const { getToken, AsyncStorage } = load();
    await AsyncStorage.setItem("@auth_token", "legado");

    expect(await getToken()).toBe("legado");
    expect(store.get("auth_token")).toBe("legado");
    expect(await AsyncStorage.getItem("@auth_token")).toBeNull();
  });

  it("access y refresh token usan claves distintas", async () => {
    const store = mockSecureStore();
    const { setToken, setRefreshToken, getToken, getRefreshToken } = load();

    await setToken("acceso");
    await setRefreshToken("refresco");

    expect(await getToken()).toBe("acceso");
    expect(await getRefreshToken()).toBe("refresco");
    expect(store.get("refresh_token")).toBe("refresco");
  });

  it("removeToken limpia ambos almacenes", async () => {
    const store = mockSecureStore();
    const { setToken, removeToken, getToken, AsyncStorage } = load();
    await setToken("abc");
    await AsyncStorage.setItem("@auth_token", "residuo");

    await removeToken();

    expect(store.has("auth_token")).toBe(false);
    expect(await AsyncStorage.getItem("@auth_token")).toBeNull();
    expect(await getToken()).toBeNull();
  });

  it("devuelve null si no hay nada guardado", async () => {
    mockSecureStore();
    const { getToken, getRefreshToken } = load();

    expect(await getToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});

describe("sin SecureStore (plataforma no soportada)", () => {
  it("cae a AsyncStorage", async () => {
    mockSecureStore({ available: false });
    const { setToken, getToken, setRefreshToken, getRefreshToken, removeRefreshToken, AsyncStorage } =
      load();

    await setToken("abc");
    await setRefreshToken("ref");

    expect(await AsyncStorage.getItem("@auth_token")).toBe("abc");
    expect(await getToken()).toBe("abc");
    expect(await getRefreshToken()).toBe("ref");

    await removeRefreshToken();
    expect(await getRefreshToken()).toBeNull();
  });
});

describe("build sin el modulo nativo", () => {
  it("no rompe: usa AsyncStorage cuando el import falla", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockSecureStore({ importFails: true });
    const { setToken, getToken, AsyncStorage } = load();

    await setToken("abc");

    expect(await getToken()).toBe("abc");
    expect(await AsyncStorage.getItem("@auth_token")).toBe("abc");
    warn.mockRestore();
  });
});
