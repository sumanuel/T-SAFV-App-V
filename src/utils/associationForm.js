// Formulario de "Datos de la asociacion": valores iniciales y cuerpo de la
// peticion de actualizacion.

export function buildAssociationForm(association) {
  return {
    nombre: association?.nombre || "",
    rif: association?.rif || "",
    direccion_fiscal: association?.direccion_fiscal || "",
    email: association?.email || "",
    telefonos: association?.telefonos || "",
    logo_url: association?.logo_url || "",
    logo_data: association?.logo_data || "",
    redes_sociales: association?.redes_sociales
      ? JSON.stringify(association.redes_sociales, null, 2)
      : "",
  };
}

export function buildAssociationUpdatePayload(form, socialLinks) {
  return {
    nombre: form.nombre,
    rif: form.rif,
    direccion_fiscal: form.direccion_fiscal,
    email: form.email,
    telefonos: form.telefonos,
    logo_url: form.logo_url,
    logo_data: form.logo_data,
    redes_sociales: socialLinks,
  };
}

// Imagen a mostrar como logo: la subida desde la galeria tiene prioridad sobre
// la URL.
export function getLogoPreview(form) {
  return form.logo_data?.trim() || form.logo_url.trim();
}
