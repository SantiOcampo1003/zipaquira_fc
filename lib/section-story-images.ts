/**
 * Imágenes panorámicas por capítulo (01–05) enlazadas a secciones concretas de la landing.
 * `?v=` invalida caché al sustituir archivos en `public/images/story/`.
 */
const v = "5";

export const sectionStoryImages = {
  /** 01 · Origen — mina, esfuerzo en la mina */
  manifesto: `/images/story/story-01-origen.png?v=${v}`,
  /** 02 · Nueva generación — estadio, hinchada, energía (no repetir mineros) */
  newGeneration: `/images/story/story-02-fuerza.png?v=${v}`,
  /** 03 · Identidad — Catedral de Sal, cruz dorada (nueva) */
  values: `/images/story/story-03-identidad.png?v=${v}`,
  /** 04 · Seguidor → hincha fundador — jugador, camiseta, estadio */
  community: `/images/story/story-04-comunidad.png?v=${v}`,
  /** 05 · Futuro — túnel cristalino hacia el estadio (nueva) */
  storyCta: `/images/story/story-05-futuro.png?v=${v}`,
} as const;
