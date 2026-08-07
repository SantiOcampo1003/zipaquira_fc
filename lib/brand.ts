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

export const brandMissionStatement = `${clubName} nace desde su historia para transformar su presente: un equipo que honra su origen y activa el desarrollo de toda una ciudad.`;

export const brandIdentityLabel = "Nuestra identidad";
export const brandImpactHeading = "Impacto en la ciudad";

/** Contacto WhatsApp (Colombia · +57). */
export const whatsappPhone = "3227895453";
export const whatsappUrl = `https://wa.me/57${whatsappPhone}`;

/** Partido inaugural — Liga El Dorado. */
export const matchHeadline = "Partido inaugural";
export const matchCompetition = "Liga El Dorado";
export const matchOpponent = "Sabana";
export const matchOpponentDetail = "el equipo de Omar Pérez";
export const matchVenue = "Estadio El Campín";
export const matchRole = "Visitantes";
export const matchMarqueeLabel = "PARTIDO INAUGURAL · EL CAMPÍN";
export const matchChallengeHeadline = "Dicen que no llenamos El Campín.";
export const matchChallengePunchline = "Demostremos que se equivocan.";
export const matchChallengeBody =
  "Zipaquirá F.C. debuta en el partido inaugural de la Liga El Dorado frente a Sabana, el equipo de Omar Pérez. Jugamos de visitantes en El Campín: la ciudad entera tiene una cita con la historia.";
export const matchTicketCta = "Quiero mi boleta";
export const matchTicketFormTitle = "Deja tus datos y sé el primero en saber";
export const matchTicketFormBody =
  "Regístrate con tus datos. Te enviaremos más adelante la información de boletas y cómo vivir este partido desde la tribuna.";

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
