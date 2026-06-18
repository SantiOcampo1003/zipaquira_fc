import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Heart,
  Landmark,
  MapPin,
  Megaphone,
  Rocket,
  Share2,
  Sparkles,
  Star,
  Target,
  Users,
  UsersRound,
  UserRound,
} from "lucide-react";
import { brandImpactPillars, clubNameUpper } from "@/lib/brand";

/**
 * Mismo archivo que `public/images/camiseta-real-zipaquira.png`.
 * El `?v=` solo invalida caché del navegador al cambiar el PNG (sube el número si haces otro reemplazo).
 */
export const kitImagePath = "/images/camiseta-real-zipaquira.png?v=3";

/** Render 3D cinematográfico del frente de la camiseta. */
export const kitImageAlt =
  "Render 3D de la camiseta oficial Zipaquirá F.C.: negro texturizado y oro metálico, leyenda Zipaquirá somos todos, gráfica de túnel con vagoneta y cristales de sal, Reebok, cuello con Alma zipaquireña y detalle RZX en el bajo.";

/** Párrafos editoriales alineados con esta imagen (una pieza 3D, no tablero). */
export const kitFuturistNarrative: string[] = [
  "Esta es la visual en tres dimensiones del frente del kit: volumen en la tela, brillo en el oro y la escena de la mina como protagonista. Es la misma identidad del club, pensada para pantallas y vitrinas con impacto de producto premium.",
  "Negro profundo con textura casi mineral, mensaje en el pecho y el túnel con cristales que nos recuerdan de dónde venimos. Reebok y el escudo cierran una camiseta que se siente futurista y profundamente zipaquireña.",
];

export const kitTechnicalFeatures: string[] = [
  "Render 3D de alta fidelidad del frente del kit",
  "«Zipaquirá somos todos» en oro sobre textura oscura",
  "Gráfica de túnel, vagoneta y cristales de sal en el torso",
  "Escudo con corona y branding Reebok en acabado oro",
  "Cuello en V con ribete dorado y detalle «Alma zipaquireña»",
  "Etiqueta de autenticidad y código RZX en el bajo de la prenda",
];

export const kitIdentityPillars: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Catedral de Sal",
    body: "El símbolo que nos representa ante el mundo: identidad y raíces.",
    icon: Landmark,
  },
  {
    title: "Sal de Zipaquirá",
    body: "Inspiración gráfica y textura que conectan el kit con nuestro territorio.",
    icon: Sparkles,
  },
  {
    title: "Nuestra gente",
    body: "Cada detalle piensa en quienes entrenan, alientan y construyen el club.",
    icon: Users,
  },
  {
    title: "Nuestro futuro",
    body: "Una estrella que marca el comienzo: el camino apenas empieza.",
    icon: Star,
  },
];

export const newGenerationBlocks: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: brandImpactPillars[0].title,
    body: brandImpactPillars[0].body,
    icon: MapPin,
  },
  {
    title: brandImpactPillars[1].title,
    body: brandImpactPillars[1].body,
    icon: UsersRound,
  },
  {
    title: brandImpactPillars[2].title,
    body: brandImpactPillars[2].body,
    icon: Briefcase,
  },
  {
    title: brandImpactPillars[3].title,
    body: brandImpactPillars[3].body,
    icon: GraduationCap,
  },
];

export const coreValues: { title: string; tagline: string }[] = [
  { title: "Trabajo", tagline: "Nacemos desde la raíz de la ciudad." },
  { title: "Disciplina", tagline: "El hábito vence la excusa." },
  { title: "Resiliencia", tagline: "Perseverancia en cancha y en la vida." },
  { title: "Orgullo local", tagline: "Zipaquirá primero, siempre." },
  { title: "Comunidad", tagline: "Nada importa si no lo hacemos juntos." },
  { title: "Excelencia", tagline: "Estándar alto en cancha y en gesto." },
  { title: "Cantera", tagline: "El futuro se forma desde la base." },
  { title: "Integración", tagline: "Caben todas las voces y los barrios." },
];

export const funnelSteps: { step: number; title: string; description: string; icon: LucideIcon }[] =
  [
    {
      step: 1,
      title: "Descubre el proyecto",
      description: "Entiende la visión, el espíritu y lo que estamos construyendo.",
      icon: Rocket,
    },
    {
      step: 2,
      title: "Únete a la comunidad",
      description: "Regístrate y entra al círculo fundador con prioridad en novedades.",
      icon: Users,
    },
    {
      step: 3,
      title: "Participa en eventos",
      description: "Vive encuentros, activaciones y momentos antes del primer pitazo.",
      icon: CalendarDays,
    },
    {
      step: 4,
      title: "Invita a otros",
      description: "Cada fundador suma: familia, amigos, barrio y trabajo.",
      icon: Share2,
    },
    {
      step: 5,
      title: "Haz parte de la historia",
      description: "Sé de los primeros en decir: estuve desde el inicio.",
      icon: Megaphone,
    },
  ];

export const sponsorOffers: { title: string; description: string }[] = [
  {
    title: "Visibilidad local",
    description: "Presencia donde la ciudad conversa: cancha, barrio y día a día.",
  },
  {
    title: "Activaciones en ciudad",
    description: "Experiencias que acercan tu marca a la emoción del juego.",
  },
  {
    title: "Contenido digital",
    description: "Historias y piezas con tono de club moderno y comunidad real.",
  },
  {
    title: "Eventos con comunidad",
    description: "Espacios para sorprender, premiar y fidelizar con propósito.",
  },
  {
    title: "Datos de audiencia",
    description: "Comunidad en crecimiento con segmentos claros para aliados.",
  },
  {
    title: "Alianzas de impacto",
    description: "Proyectos que conecten marca, territorio y deporte con sentido.",
  },
];

export const playerPillars: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Equipo competitivo",
    description: "Ambición seria para representar a la ciudad con exigencia.",
    icon: Target,
  },
  {
    title: "Cantera",
    description: "Base formativa para talento joven con mirada de largo plazo.",
    icon: Sparkles,
  },
  {
    title: "Visorias",
    description: "Procesos claros para quien quiera demostrar hambre y carácter.",
    icon: Users,
  },
  {
    title: "Formación integral",
    description: "Competir, estudiar y crecer como persona dentro del proyecto.",
    icon: Heart,
  },
];

export const galleryPlaceholders: { label: string; hint: string }[] = [
  { label: "Entrenamientos", hint: "Próximas fotos oficiales" },
  { label: "Comunidad", hint: "Eventos y encuentros fundadores" },
  { label: "Ciudad", hint: "Zipaquirá en el corazón del club" },
  { label: "Cantera", hint: "Base y talento joven" },
  { label: "Hinchas", hint: "Aliento y color local" },
  { label: "Aliados", hint: "Marcas que creen en el movimiento" },
];

export const marqueePhrases = [
  clubNameUpper,
  "CONVOCATORIAS 6 DE JULIO",
  "JUGAMOS CON EL ALMA",
  "ZIPAQUIRÁ",
  "DISCIPLINA",
  "CANTERA",
] as const;

export const convocatoriaHighlights: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Fecha",
    description: "Convocatorias el domingo 6 de julio de 2026. Llega puntual y con actitud.",
    icon: CalendarDays,
  },
  {
    title: "Para quién",
    description:
      "Jugadores que quieran representar a Zipaquirá con disciplina, hambre y compromiso.",
    icon: UserRound,
  },
  {
    title: "Qué necesitas",
    description:
      "Documento de identidad, datos deportivos, contacto de emergencia y ficha médica básica.",
    icon: ClipboardList,
  },
  {
    title: "Dónde inscribirte",
    description: "Completa la ficha del jugador en línea. El registro es obligatorio para participar.",
    icon: MapPin,
  },
];

export const convocatoriaSteps = [
  "Haz clic en «Completar ficha e inscribirme» para abrir el formulario oficial.",
  "Llena todos los campos: datos personales, posición, experiencia y contacto de emergencia.",
  "Revisa que la información sea verídica y envía el formulario.",
  "Presenta el día de las convocatorias con ropa deportiva y documento de identidad.",
] as const;
