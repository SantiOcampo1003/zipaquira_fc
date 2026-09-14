/** Ruta donde vive cada id de sección, para navegar cuando no está en la página actual. */
const ROUTE_BY_ID: Record<string, string> = {
  inicio: "/",
  "camiseta-conmemorativa": "/",
  camiseta: "/",
  partido: "/partidos",
  partidos: "/partidos",
  boletas: "/partidos",
  historia: "/partidos",
  nosotros: "/nosotros",
  comunidad: "/nosotros",
  valores: "/nosotros",
  galeria: "/nosotros",
  jugadores: "/jugadores",
  patrocinadores: "/patrocinadores",
  silleteria: "/tribuna",
};

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const path = ROUTE_BY_ID[id];
  if (path) {
    window.location.assign(path === "/" ? `/#${id}` : `${path}#${id}`);
  }
}
