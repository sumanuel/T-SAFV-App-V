/**
 * vehicleService.js � API real para unidades de la asociacion
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import sdk from "../api/sdk";

function resolveError(res, fallback) {
  return res?.data?.message || res?.data?.error || fallback;
}

export async function listVehicles(token, asociacionId) {
  if (!asociacionId) return [];
  const res = await sdk.getAssociationUnits(token, asociacionId);
  if (res.status !== 200) return [];
  return res.data || [];
}

const UNITS_CACHE_PREFIX = "@units_cache_";
const unitsCacheKey = (asociacionId) => `${UNITS_CACHE_PREFIX}${asociacionId}`;

// Se llama al cerrar sesion: la lista incluye datos de choferes/propietarios.
export async function clearUnitsCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((key) => key.startsWith(UNITS_CACHE_PREFIX));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {
    // best-effort
  }
}

// Unidades de la asociacion con respaldo local: si no hay conexion se usa la
// ultima lista descargada, para poder seguir registrando fiscalizaciones.
export async function listVehiclesWithCache(token, asociacionId) {
  if (!asociacionId) return { units: [], fromCache: false, failed: false };

  const res = await sdk.getAssociationUnits(token, asociacionId);
  if (res.status === 200) {
    const units = res.data || [];
    AsyncStorage.setItem(
      unitsCacheKey(asociacionId),
      JSON.stringify(units),
    ).catch(() => {});
    return { units, fromCache: false, failed: false };
  }

  try {
    const cached = await AsyncStorage.getItem(unitsCacheKey(asociacionId));
    if (cached) {
      return { units: JSON.parse(cached), fromCache: true, failed: false };
    }
  } catch {
    // cache ilegible: se trata como sin cache
  }
  return { units: [], fromCache: false, failed: true };
}

export async function listMyVehicles(token, asociacionId) {
  if (!asociacionId) return [];
  const res = await sdk.getMyOwnerUnits(token);
  if (res.status !== 200) return [];
  return (res.data || []).filter(
    (unit) => String(unit.asociacion_id) === String(asociacionId),
  );
}

export async function listVehiclesByPropietarioId(
  token,
  asociacionId,
  propietarioId,
) {
  const all = await listVehicles(token, asociacionId);
  return all.filter((v) => String(v.propietario_id) === String(propietarioId));
}

export async function createVehicle(token, asociacionId, payload) {
  const res = await sdk.createAssociationUnit(token, asociacionId, payload);
  if (res.status === 201 || res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo crear la unidad."));
}

export async function updateVehicle(token, asociacionId, unidadId, payload) {
  const res = await sdk.updateAssociationUnit(
    token,
    asociacionId,
    unidadId,
    payload,
  );
  if (res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo actualizar la unidad."));
}

export async function updateMyVehicle(token, asociacionId, unidadId, payload) {
  const res = await sdk.updateMyAssociationUnit(
    token,
    asociacionId,
    unidadId,
    payload,
  );
  if (res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo actualizar la unidad."));
}

export async function deleteVehicle(token, asociacionId, unidadId) {
  const res = await sdk.deleteAssociationUnit(token, asociacionId, unidadId);
  if (res.status === 200 || res.status === 204) return;
  throw new Error(resolveError(res, "No se pudo eliminar la unidad."));
}
