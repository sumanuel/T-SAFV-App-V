# PLAN-002 — Foto de pasajeros en fiscalizaciones y módulo de Incidencias

Estado: **propuesto, sin código**. Fecha: 2026-10-22.

## 1. Alcance acordado

| Tema                              | Decisión                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Foto en la fiscalización          | **Opcional**, **1 por fiscalización**, tomada con la **cámara o elegida de la galería**. Es de los **pasajeros**.                  |
| Quién la ve                       | **Todos** los que pueden ver esa fiscalización (administrador, fiscal y propietario de la unidad).                                 |
| Módulo nuevo: **Incidencias**     | Registrar una **infracción** o **cualquier evento fuera de una fiscalización** (con o sin unidad, con fotos).                      |
| Privacidad                        | Sin exigencia formal por ahora.                                                                                                    |
| Tiempo de conservación de fotos   | **PENDIENTE DE DEFINIR** (ver §6). Mientras tanto no se borra nada.                                                                |

## 2. Diseño técnico

### 2.1 Almacenamiento de fotos (API)

- **Tabla aparte `adjuntos`**, nunca en la fila del registro: los listados no deben cargar bytes.
  Columnas: `id`, `entidad_tipo` (`REGISTRO` | `INCIDENCIA`), `entidad_id`, `mime`, `bytes` (tamaño), `sha256`,
  `contenido BYTEA`, `subido_por`, `created_at`.
- **Por qué BYTEA y no archivos en disco:** el despliegue es un zip manual en hosting compartido; una carpeta
  `uploads/` dentro del proyecto se pierde al volver a subir el zip. Con la foto comprimida (~150–250 KB) y el
  volumen actual (13 registros en producción) la base lo aguanta bien y las copias de seguridad quedan completas.
- **Interfaz `attachmentStorage`** (`save`, `read`, `remove`) para poder pasar a disco externo u objeto (S3) más adelante
  cambiando un solo archivo.
- **Subida como binario**, no base64 en JSON (evita el +33 % y el límite de 12 MB):
  `POST /api/adjuntos/:entidad_tipo/:entidad_id` con `Content-Type: image/jpeg` y `express.raw({ limit: "3mb" })`.
- **Validación en el servidor:** tipo real por los primeros bytes (JPEG/PNG), tamaño máximo, un solo adjunto por
  registro, y el usuario debe ser quien creó la entidad o administrador de la asociación.
- **Lectura autenticada:** `GET /api/adjuntos/:id` con los mismos permisos que la entidad padre; respuesta con
  `Content-Type` real, `Cache-Control: private` y `X-Content-Type-Options: nosniff`.

### 2.2 Módulo Incidencias (API)

Tabla `incidencias`:

| Columna                                          | Notas                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `id`, `asociacion_id`                            |                                                                         |
| `unidad_id` (opcional)                           | Un evento puede no estar ligado a una unidad.                           |
| `registro_id` (opcional)                         | Para vincularla a una fiscalización concreta si aplica.                 |
| `tipo`                                           | Catálogo (ver §5, pendiente de confirmar).                              |
| `descripcion`, `lugar`                           | Texto libre.                                                            |
| `fecha_hora_evento`                              | Hora real en el teléfono (respeta modo offline, igual que fiscalización). |
| `estado`                                         | `ABIERTA` → `EN_REVISION` → `CERRADA`.                                  |
| `reportada_por`, `cerrada_por`, `cerrada_at`     |                                                                         |
| `client_request_id` (UUID)                       | Idempotencia para reintentos sin duplicar.                              |

Endpoints: crear, listar (filtros por estado, tipo, unidad y fechas), ver detalle, cambiar estado, adjuntar fotos.
El propietario de la unidad recibe una notificación (se reutiliza `notifyUser`, igual que en fiscalización).

### 2.3 App

- **Fiscalización:** botón opcional "Agregar foto de pasajeros" (cámara/galería) en `FiscalRecordFormScreen`;
  miniatura en la fila de Traza con vista ampliada.
- **Incidencias:** pantallas lista, formulario y detalle (carpeta `screens/incidencias/`, más `hooks/` y `utils/`
  con pruebas, como en el resto de la app). Acceso desde Inicio ("Registrar incidencia") y desde "Más opciones";
  **no se agrega una sexta pestaña** a la barra inferior.
- **Compresión en el teléfono:** `expo-image-manipulator` (redimensionar a ~1280 px y JPEG ~0,6). Solo con
  `quality` del selector una foto de cámara pesa 1–3 MB, demasiado para datos móviles.
- **Cámara:** `expo-image-picker` ya está instalado; falta el permiso de cámara en el plugin de `app.config.js`.

### 2.4 Modo offline (la parte delicada)

- Las fotos **no caben en AsyncStorage**: se copian a `documentDirectory` (`expo-file-system`) y la cola guarda solo la ruta.
- La cola se generaliza a una **bandeja de salida** con dos pasos por elemento: (1) enviar el registro o la incidencia
  (idempotente por `client_request_id`), (2) subir la foto cuando el paso 1 devolvió el id. Si falla la foto, el registro
  **ya quedó guardado**: una foto pesada nunca hace perder una fiscalización.
- Al subir la foto con éxito se borra el archivo local; las rechazadas definitivamente quedan visibles como hoy.

## 3. Fases

| Fase | Contenido                                                                                                  | Repo | Requiere build nativo |
| ---- | ---------------------------------------------------------------------------------------------------------- | ---- | --------------------- |
| 0    | Confirmar catálogo de tipos y permisos de incidencias (§5).                                                | —    | —                     |
| 1    | Migraciones `adjuntos` e `incidencias`; modelos, controladores, rutas y pruebas unitarias; script de retención (§6) apagado por defecto. | API  | No                    |
| 2    | Servicios y utilidades de la app (subida, compresión, bandeja de salida generalizada) con pruebas.        | App  | Sí (`expo-image-manipulator`, permiso de cámara) |
| 3    | Foto opcional en la fiscalización y vista en Traza.                                                        | App  | —                     |
| 4    | Módulo Incidencias: lista, formulario, detalle, notificación al propietario.                               | App  | —                     |
| 5    | Despliegue: migrar, desplegar API, `eas build`, prueba en dispositivo.                                     | Ambos | —                    |

Cada fase se entrega con lint, formato, pruebas y export en verde, y en commits separados.
La API es **retrocompatible**: las versiones actuales de la app siguen funcionando sin cambios.

## 4. Riesgos

- **Tamaño de la base:** sin política de retención las fotos crecen sin límite. Mitigación: foto comprimida, un máximo
  por registro y el script de §6.
- **Datos móviles del fiscal:** la subida es independiente del registro y se reintenta sola; nunca bloquea el trabajo.
- **Cámara en segundo plano de Android** puede reiniciar la app al volver: el borrador del formulario debe sobrevivir.
- **Contenido ajeno al esperado** (cualquier archivo con extensión de imagen): se valida el tipo real en el servidor.

## 5. Supuestos a confirmar (Fase 0)

Si no se indica otra cosa, se implementa con estos valores por defecto:

1. **Tipos de incidencia:** `INFRACCION`, `ACCIDENTE`, `FALLA_MECANICA`, `CONDUCTA_CHOFER`, `OTRO`.
2. **Quién registra:** fiscales y administradores. El propietario **solo ve** las de sus unidades.
3. **Quién cambia el estado / cierra:** administradores.
4. **Fotos por incidencia:** hasta **3** (en la fiscalización es 1).
5. **Notificación:** al propietario de la unidad cuando se registra una incidencia sobre ella.

## 6. Conservación de fotos — recomendación y nota pendiente

> **PENDIENTE (a definir por el negocio):** cuánto tiempo se guardan las fotos. Hasta entonces **no se borra nada**
> y el script de retención queda apagado.

Recomendación mientras se decide:

| Contenido                                         | Conservar                                       | Motivo                                                                      |
| ------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Foto de pasajeros en una fiscalización            | **90 días**                                     | Sirve de respaldo operativo inmediato; después pesa y expone datos personales sin aportar. |
| Fotos de una incidencia **abierta o en revisión** | Mientras siga abierta                           | Es evidencia de un caso en curso.                                           |
| Fotos de una incidencia **cerrada**               | **12 meses** desde el cierre (24 si hay infracciones con reclamo) | Cubre reclamos y auditorías razonables.                      |
| Datos del registro/incidencia (texto)             | Sin límite                                      | Pesan poco y son la trazabilidad.                                           |

Implementación prevista: variables de entorno `RETENCION_DIAS_FOTO_REGISTRO` y `RETENCION_MESES_FOTO_INCIDENCIA`
(vacías = no se borra). Script `scripts/purgar_adjuntos.js` que por defecto **solo informa** qué borraría
(`--aplicar` para borrar), pensado para correr desde el cron del hosting. Se borra el archivo y se deja la fila con
`purgado_at`, para que la app muestre "foto eliminada" en vez de un error.
