import Image from "next/image";
import { Camera, Check, CircleUser, Globe, Settings, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    Icon: Globe,
    title: "Entra a Betsson",
    text: "Abre betsson.co (o la app) e inicia sesión con la cuenta que creaste con el link del club.",
  },
  {
    Icon: CircleUser,
    title: "Toca la personita",
    text: "Es el ícono de perfil, arriba a la derecha de la pantalla.",
  },
  {
    Icon: Settings,
    title: "Configuración de la cuenta",
    text: "En el menú que se abre, elige “Configuración de la cuenta”.",
  },
  {
    Icon: UserRound,
    title: "Entra a “Mi perfil”",
    text: "Ahí aparece la sección “Datos Personales” con tu nombre y tu correo.",
  },
  {
    Icon: Camera,
    title: "Toma el pantallazo",
    text: "Captura la pantalla completa y súbela aquí abajo. ¡Listo!",
  },
];

const DOS = ["Se ve betsson.co o el logo de Betsson", "Se lee tu nombre completo y tu correo", "Pantalla completa, sin recortar"];
const DONTS = ["Fotos a otra pantalla o imágenes editadas", "Capturas de otra sección (inicio, apuestas…)", "El pantallazo de otra persona"];

/** Paso a paso (con ejemplo) de cómo sacar el pantallazo del perfil de Betsson. */
export function BetssonGuide({ className }: { className?: string }) {
  return (
    <section
      className={cn("rounded-2xl border border-[#F26B21]/30 bg-[#18181B]/95 p-5 sm:p-6", className)}
      aria-labelledby="betsson-guide-title"
    >
      <h2 id="betsson-guide-title" className="font-heading text-lg uppercase tracking-wide text-white">
        ¿Cómo saco el pantallazo?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Son 4 toques y una captura. Así se ve el resultado:</p>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <ol className="space-y-3">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="flex gap-3">
                <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#F26B21]/40 bg-[#F26B21]/10 text-[#F26B21]">
                  <Icon className="size-5" />
                  <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#F26B21] font-heading text-[11px] font-bold text-black">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">Sí</p>
              <ul className="space-y-1">
                {DOS.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-white/85">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300">No</p>
              <ul className="space-y-1">
                {DONTS.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-white/85">
                    <X className="mt-0.5 size-3.5 shrink-0 text-rose-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <figure className="mx-auto w-full max-w-[220px] md:max-w-none">
          <div className="overflow-hidden rounded-[1.75rem] border-4 border-white/15 bg-black shadow-xl">
            <Image
              src="/images/betsson/ejemplo-pantallazo.jpg"
              alt="Ejemplo del pantallazo: sección Datos Personales del perfil de Betsson"
              width={700}
              height={1514}
              sizes="(min-width: 768px) 240px, 220px"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-2 text-center text-[11px] text-muted-foreground">
            Ejemplo. Los datos personales de la imagen están tapados.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
