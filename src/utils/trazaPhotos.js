// La API acepta hasta 200 ids por consulta de resumen de fotos.
export const SUMMARY_CHUNK_SIZE = 200;

// Ids unicos y validos de los registros de traza, en bloques para la API.
export function chunkRecordIds(items, size = SUMMARY_CHUNK_SIZE) {
  const ids = [];
  const seen = new Set();
  for (const item of items || []) {
    const id = item?.id;
    if (id === undefined || id === null || id === "") continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(key);
  }
  const chunks = [];
  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }
  return chunks;
}

// [{ entidad_id, adjunto_id }] -> { [idRegistro]: idAdjunto }
export function buildPhotoMap(rows) {
  const map = {};
  for (const row of rows || []) {
    if (row?.entidad_id == null || row?.adjunto_id == null) continue;
    map[String(row.entidad_id)] = String(row.adjunto_id);
  }
  return map;
}
