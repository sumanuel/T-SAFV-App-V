// Campos del formulario de unidad, en el orden en que se encadena el foco
// ("siguiente" salta al campo que sigue, incluso entre secciones). `scrollY` es
// el desplazamiento al que se lleva la pantalla al enfocar cada campo.
export const VEHICLE_SECTIONS = [
  {
    title: "Datos de identificación",
    fields: [
      {
        key: "placa",
        label: "Placa *",
        placeholder: "ABC-123",
        autoCapitalize: "characters",
        scrollY: 280,
      },
      {
        key: "numero_unidad",
        label: "Número de unidad *",
        placeholder: "001",
        scrollY: 340,
      },
      {
        key: "numero_puestos",
        label: "N° puestos / asientos",
        placeholder: "0",
        keyboardType: "numeric",
        scrollY: 400,
      },
      {
        key: "marca",
        label: "Marca",
        placeholder: "Toyota",
        autoCapitalize: "words",
        scrollY: 460,
      },
      {
        key: "modelo",
        label: "Modelo",
        placeholder: "Corolla",
        autoCapitalize: "words",
        scrollY: 520,
      },
      {
        key: "ano",
        label: "Ano",
        placeholder: "2020",
        keyboardType: "numeric",
        scrollY: 580,
      },
      {
        key: "color",
        label: "Color",
        placeholder: "Blanco",
        autoCapitalize: "words",
        scrollY: 640,
      },
    ],
  },
  {
    title: "Datos técnicos",
    fields: [
      {
        key: "numero_cilindros",
        label: "N° cilindros",
        placeholder: "4",
        keyboardType: "numeric",
        scrollY: 760,
      },
      {
        key: "peso",
        label: "Peso",
        placeholder: "1200 kg",
        scrollY: 820,
      },
      {
        key: "serial_carroceria",
        label: "Serial de carrocería",
        placeholder: "1HGCM826...",
        autoCapitalize: "characters",
        scrollY: 880,
      },
      {
        key: "serial_motor",
        label: "Serial de motor",
        placeholder: "B20B...",
        autoCapitalize: "characters",
        scrollY: 940,
      },
      {
        key: "capacidad",
        label: "Capacidad",
        placeholder: "Capacidad",
        scrollY: 1000,
      },
    ],
  },
  {
    title: "Documentos y responsable",
    fields: [
      {
        key: "fecha_emision",
        label: "Fecha de emisión (AAAA-MM-DD)",
        placeholder: "2024-01-15",
        keyboardType: "numeric",
        scrollY: 1120,
      },
      {
        key: "numero_poliza_rcv",
        label: "N° póliza RCV",
        placeholder: "RCV-000000",
        autoCapitalize: "characters",
        scrollY: 1180,
      },
      {
        key: "chofer",
        label: "Chofer habitual",
        placeholder: "Nombre del chofer",
        autoCapitalize: "words",
        scrollY: 1240,
      },
    ],
  },
];

export const VEHICLE_FIELD_COUNT = VEHICLE_SECTIONS.reduce(
  (total, section) => total + section.fields.length,
  0,
);
