/**
 * Tokens del Manual de Marca ZIPA F.C.
 * Colores: verde institucional (primario), burdeos, oro y crema.
 * Tipografía web: Montserrat (secundaria oficial). Accia Piano requiere licencia local.
 */
export const clubName = "Zipaquirá F.C.";
export const clubNameUpper = "ZIPAQUIRÁ F.C.";

export const brandTagline = "Desde lo más profundo, jugamos con el alma";

/** Convocatorias de jugadores — formulario oficial (Google Forms). */
export const convocatoriaFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLScN-N9k3rMuZ3w80UJaaddwb90fOs19jW5uRZILQWhk1H6y0Q/viewform";

export const convocatoriaDateLabel = "6 de julio";
export const convocatoriaDateFull = "domingo 6 de julio de 2026";
export const convocatoriaHeadline = "Convocatorias de jugadores";

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
