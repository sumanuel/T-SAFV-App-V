export const EMPTY_ASSOCIATION_DRAFT = {
  nombre: "",
  rif: "",
  direccion_fiscal: "",
  email: "",
  telefonos: "",
  logo_url: "",
  redes_sociales: "",
};

const REQUIRED_FIELDS = [
  "nombre",
  "rif",
  "direccion_fiscal",
  "email",
  "telefonos",
];

export function hasRequiredAssociationFields(draft) {
  return REQUIRED_FIELDS.every((field) => String(draft[field] || "").trim());
}

// Redes sociales: texto libre que debe ser JSON; vacio = sin redes.
// Devuelve { ok: true, value } o { ok: false }.
export function parseSocialLinks(text) {
  if (!String(text || "").trim()) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function buildAssociationPayload(draft, socialLinks) {
  return {
    nombre: draft.nombre,
    rif: draft.rif,
    direccion_fiscal: draft.direccion_fiscal,
    email: draft.email,
    telefonos: draft.telefonos,
    logo_url: draft.logo_url,
    redes_sociales: socialLinks,
  };
}
