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

/** Convocatorias de jugadores — formulario oficial (Google Forms). */
export const convocatoriaFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSehDskJrSDVSef5--iYZtKVyZfhlb295W5yXtIjIewKeaXmTQ/viewform?usp=publish-editor";

export const convocatoriaHeadline = "Última convocatoria";
export const convocatoriaDateLabel = "Sub-20 · Reserva y Primer equipo";
export const convocatoriaRegistrationsOpen = true;
export const convocatoriaRegistrationStatusLabel = "ABIERTA";
export const convocatoriaReopenMessage =
  "Convocatoria oficial para conformar la plantilla de Zipaquirá F.C. en sus tres categorías.";
export const convocatoriaOpenDetail =
  "Completa la ficha oficial en línea según tu categoría: Sub-20 o mayores de 20 para reserva y primer equipo.";

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
  dateLabel: "Sub-20",
  dateFull: "Categoría Sub-20 (Cantera y proyección)",
  dateShort: "Sub-20",
  timeLabel: "6:00 a.m.",
  groupsLabel: "Sub-20",
  inscripcionLabel: "Inscribirme Sub-20",
  presentationDetail:
    "Presentarse con ropa deportiva, hidratación y documento de identidad. 6 jugadores Sub-20 harán parte del plantel del primer equipo.",
};

export const convocatoriaMayores: ConvocatoriaCall = {
  id: "mayores",
  title: "Reserva y Primer equipo",
  audience: "Mayores de 20 años",
  dateLabel: "Reserva y Primer equipo",
  dateFull: "Categoría mayores (Reserva y Primer equipo)",
  dateShort: "Reserva · 1er equipo",
  timeLabel: "6:00 a.m.",
  groupsLabel: "Primer equipo y reserva",
  inscripcionLabel: "Inscribirme Reserva y 1er equipo",
  presentationDetail:
    "Primer equipo y equipo de reserva. Presentarse con ropa deportiva, hidratación y documento de identidad.",
};

export const convocatoriaCalls = [convocatoriaSub20, convocatoriaMayores] as const;

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

/** Camiseta conmemorativa de hincha oficial — venta cerrada por WhatsApp. */
export const showJerseyOrderSection = true;
export const jerseyOrderPrice = 89900;
export const jerseySizes = ["S", "M", "L", "XL"] as const;
export type JerseySizeOption = (typeof jerseySizes)[number];
export const jerseyOrderHeadline = "Camiseta conmemorativa de hincha oficial";
export const jerseyOrderSubheadline = "Edición histórica · 568 abonados";
export const jerseyOrderCtaLabel = "Comprar por WhatsApp";

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
