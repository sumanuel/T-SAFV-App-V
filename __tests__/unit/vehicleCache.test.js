jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../src/services/api/sdk", () => ({
  __esModule: true,
  default: { getAssociationUnits: jest.fn() },
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");
const sdk = require("../../src/services/api/sdk").default;
const { listVehiclesWithCache, clearUnitsCache } = require("../../src/services/vehicles/vehicleService");

const units = [{ id: 1, placa: "AB1" }, { id: 2, placa: "CD2" }];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("listVehiclesWithCache", () => {
  it("con conexion devuelve las unidades y las guarda en cache", async () => {
    sdk.getAssociationUnits.mockResolvedValue({ status: 200, data: units });

    const result = await listVehiclesWithCache("tok", 5);

    expect(result).toEqual({ units, fromCache: false, failed: false });
    await new Promise((r) => setImmediate(r));
    expect(JSON.parse(await AsyncStorage.getItem("@units_cache_5"))).toEqual(units);
  });

  it("sin conexion usa la ultima lista guardada", async () => {
    await AsyncStorage.setItem("@units_cache_5", JSON.stringify(units));
    sdk.getAssociationUnits.mockResolvedValue({ status: 0, data: null });

    expect(await listVehiclesWithCache("tok", 5)).toEqual({ units, fromCache: true, failed: false });
  });

  it("sin conexion y sin cache avisa que fallo", async () => {
    sdk.getAssociationUnits.mockResolvedValue({ status: 0, data: null });

    expect(await listVehiclesWithCache("tok", 5)).toEqual({ units: [], fromCache: false, failed: true });
  });

  it("el cache es por asociacion", async () => {
    await AsyncStorage.setItem("@units_cache_5", JSON.stringify(units));
    sdk.getAssociationUnits.mockResolvedValue({ status: 500, data: null });

    expect((await listVehiclesWithCache("tok", 6)).failed).toBe(true);
  });

  it("un cache ilegible se trata como inexistente", async () => {
    await AsyncStorage.setItem("@units_cache_5", "{roto");
    sdk.getAssociationUnits.mockResolvedValue({ status: 0, data: null });

    expect((await listVehiclesWithCache("tok", 5)).failed).toBe(true);
  });

  it("sin asociacion no consulta nada", async () => {
    expect(await listVehiclesWithCache("tok", null)).toEqual({ units: [], fromCache: false, failed: false });
    expect(sdk.getAssociationUnits).not.toHaveBeenCalled();
  });
});

describe("clearUnitsCache", () => {
  it("borra solo las listas de unidades, no otras claves", async () => {
    await AsyncStorage.setItem("@units_cache_5", "[]");
    await AsyncStorage.setItem("@units_cache_6", "[]");
    await AsyncStorage.setItem("@fiscal_queue_v1", "[]");

    await clearUnitsCache();

    expect(await AsyncStorage.getItem("@units_cache_5")).toBeNull();
    expect(await AsyncStorage.getItem("@units_cache_6")).toBeNull();
    expect(await AsyncStorage.getItem("@fiscal_queue_v1")).toBe("[]");
  });
});
