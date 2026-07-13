/**
 * Tokens del Manual de Marca ZIPA F.C.
 * Colores: verde institucional (primario), burdeos, oro y crema.
 * Tipografía web: Montserrat (secundaria oficial). Accia Piano requiere licencia local.
 */
export const clubName = "Zipaquirá F.C.";
export const clubNameUpper = "ZIPAQUIRÁ F.C.";

export const brandTagline = "Desde lo más profundo, jugamos con el alma";

/** Identidad institucional del club. */
export const brandOriginStatement =
  "Nacemos desde la raíz de la ciudad con valores de trabajo, disciplina y resiliencia.";

export const brandMissionStatement =
  `${clubName} nace desde su historia para transformar su presente: un equipo que honra su origen y activa el desarrollo de toda una ciudad.`;

export const brandIdentityLabel = "Nuestra identidad";
export const brandImpactHeading = "Impacto en la ciudad";

/** Convocatorias de jugadores — formulario oficial (Google Forms). */
export const convocatoriaFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSfjiMQmLTDjbGRjO2bbKsT1fTeOKocIIpY0OSZCLB3QQMO5cw/viewform";

/** Contacto WhatsApp (Colombia · +57). */
export const whatsappPhone = "3227895453";
export const whatsappUrl = `https://wa.me/57${whatsappPhone}`;

export const convocatoriaDateLabel = "16 JUL (Sub-20) · 18 JUL (reserva · primer equipo)";
export const convocatoriaDateShort = "16 JUL (Sub-20) · 18 JUL";
export const convocatoriaDateShortMayores = "reserva · primer equipo";
export const convocatoriaMarqueeLabel = "INSCRIPCIONES REABIERTAS · 16 (SUB-20) · 18 JUL";
export const convocatoriaHeadline = "Convocatorias de jugadores";

export type ConvocatoriaCall = {
  id: "sub20" | "mayores";
  title: string;
  audience: string;
  dateLabel: string;
  dateFull: string;
  dateShort: string;
  timeLabel?: string;
  groupsLabel: string;
  inscripcionLabel: string;
  presentationDetail: string;
};

export const convocatoriaSub20: ConvocatoriaCall = {
  id: "sub20",
  title: "Convocatoria Sub-20",
  audience: "Jugadores Sub-20",
  dateLabel: "16 (Sub-20)",
  dateFull: "jueves 16 de julio de 2026",
  dateShort: "16 (Sub-20)",
  timeLabel: "6:00 a.m.",
  groupsLabel: "Sub-20",
  inscripcionLabel: "Inscribirme Sub-20",
  presentationDetail:
    "Te esperamos el jueves 16 de julio a las 6:00 a.m. con ropa deportiva y documento de identidad.",
};

export const convocatoriaMayores: ConvocatoriaCall = {
  id: "mayores",
  title: "Convocatoria mayores de 20",
  audience: "Jugadores mayores de 20 años",
  dateLabel: "18 JUL (reserva · primer equipo)",
  dateFull: "sábado 18 de julio de 2026",
  dateShort: "18 JUL",
  timeLabel: "6:00 a.m.",
  groupsLabel: "Primer equipo y reserva",
  inscripcionLabel: "Inscribirme mayores de 20",
  presentationDetail:
    "Primer equipo y reserva. Te esperamos el sábado 18 de julio a las 6:00 a.m. con ropa deportiva y documento de identidad.",
};

export const convocatoriaCalls = [convocatoriaSub20, convocatoriaMayores] as const;

/** @deprecated Usar convocatoriaCalls. Mantenido para textos generales. */
export const convocatoriaDateFull =
  "16 (Sub-20) · jueves 16 de julio; 18 JUL (reserva · primer equipo) · sábado 18 de julio de 2026, 6:00 a.m.";

/** Inscripciones en línea. */
export const convocatoriaRegistrationsOpen = true;
export const convocatoriaRegistrationStatusLabel = "ABIERTA";
export const convocatoriaReopenMessage =
  "Reabrimos las inscripciones: muchos jugadores se quedaron por fuera y queremos darles una nueva oportunidad de hacer parte del proyecto.";
export const convocatoriaOpenDetail =
  "Completa la ficha oficial en línea. Hay dos convocatorias con fechas distintas: Sub-20 y mayores de 20 para primer equipo y reserva.";

/** Ocultar sección del kit en la landing (reactivar cuando esté listo). */
export const showKitSection = false;

export const brandColors = {
  green: "#0B2810",
  greenDark: "#061A0A",
  burgundy: "#740704",
  gold: "#A99259",
  cream: "#F4EFE5",
} as const;

/** Pilares de impacto (manual · página 2). */
export const brandImpactPillars: { title: string; body: string }[] = [
  {
    title: "Turismo deportivo",
    body: "Zipaquirá como destino: el fútbol abre la puerta a vivir la ciudad con otro orgullo.",
  },
  {
    title: "Integración social",
    body: "Un club que convoca barrios, familias y generaciones alrededor de un mismo sueño.",
  },
  {
    title: "Generación de empleo",
    body: "Proyecto con impacto real en la economía local y en quienes hacen posible el juego.",
  },
  {
    title: "Formación de talento joven",
    body: "Cantera, visorias y oportunidades para que el futuro se entrene desde la base.",
  },
];

/** Valores raíz del manual. */
export const brandRootValues = ["Trabajo", "Disciplina", "Resiliencia"] as const;
