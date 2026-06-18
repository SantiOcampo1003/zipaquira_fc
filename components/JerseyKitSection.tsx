"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { useRef, useState } from "react";
import { InscripcionButton } from "@/components/InscripcionButton";
import { Separator } from "@/components/ui/separator";
import { ImageLightbox } from "@/components/ImageLightbox";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import {
  kitFuturistNarrative,
  kitIdentityPillars,
  kitImageAlt,
  kitImagePath,
  kitTechnicalFeatures,
} from "@/lib/landing-data";
import { clubName } from "@/lib/brand";

function JerseyKitStage({
  lightboxOpen,
  onOpenLightbox,
}: {
  lightboxOpen: boolean;
  onOpenLightbox: () => void;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });

  const shine = useMotionTemplate`radial-gradient(560px circle at ${mx}px ${my}px, rgba(169,146,89,0.34), transparent 50%)`;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    mx.set(px);
    my.set(py);
    const nx = (px / r.width - 0.5) * 2;
    const ny = (py / r.height - 0.5) * 2;
    rotateX.set(-ny * 7);
    rotateY.set(nx * 9);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      <motion.div
        className="pointer-events-none absolute -bottom-10 left-[8%] right-[8%] z-0 h-16 rounded-[100%]"
        aria-hidden
        animate={
          reduce
            ? undefined
            : {
                opacity: [0.4, 0.62, 0.4],
                scaleX: [0.88, 1.02, 0.88],
              }
        }
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(169,146,89,0.12),transparent_58%)] blur-2xl" />
      <div
        ref={wrapRef}
        className="relative z-10 [perspective:1400px]"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <motion.div
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -5, 0],
                  x: [0, 2, -1, 0],
                  rotateZ: [0, 0.32, 0],
                }
          }
          transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="transform-gpu"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onOpenLightbox}
              className="group relative w-full overflow-visible rounded-2xl border border-primary/25 bg-[#050508] text-left shadow-[0_32px_100px_-28px_rgba(0,0,0,0.85)] ring-1 ring-white/5 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-primary/50 hover:shadow-[0_40px_120px_-22px_rgba(169,146,89,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c] motion-reduce:transition-colors"
              aria-haspopup="dialog"
              aria-expanded={lightboxOpen}
              aria-label="Ver la camiseta a tamaño completo. Arrastra sobre la imagen para explorar el ángulo."
              style={{ transform: "translateZ(0)" }}
            >
              <div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(125deg, rgba(169,146,89,0.12) 0%, transparent 40%, rgba(169,146,89,0.1) 60%, transparent 85%)",
                }}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: shine }}
              />
              <div className="relative aspect-[1024/769] w-full overflow-hidden rounded-2xl">
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,transparent_40%,rgba(0,0,0,0.45)_100%)]"
                  aria-hidden
                />
                <Image
                  src={kitImagePath}
                  alt={kitImageAlt}
                  fill
                  className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={false}
                  unoptimized
                />
                <div
                  className="pointer-events-none absolute right-2 top-2 z-[2] sm:right-3 sm:top-3"
                  aria-hidden
                >
                  <span className="inline-flex rounded-full border border-primary/40 bg-black/55 p-2 text-primary shadow-[0_0_20px_rgba(169,146,89,0.2)] backdrop-blur-sm sm:p-2.5">
                    <Maximize2 className="size-4 sm:size-[1.125rem]" strokeWidth={2.25} />
                  </span>
                </div>
                <motion.p
                  className="pointer-events-none absolute bottom-3 left-3 z-[2] max-w-[55%] text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary/70 sm:bottom-4 sm:left-4 sm:max-w-none sm:text-xs"
                  animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  
                </motion.p>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>
      <p className="mt-4 text-center text-[0.65rem] font-medium uppercase tracking-[0.28em] text-primary/50">
        Visual 3D · frente del kit
      </p>
    </div>
  );
}

export function JerseyKitSection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <section
      id="camiseta"
      className="relative scroll-mt-20 border-t border-white/[0.07] bg-[#08080c] py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute -left-40 top-20 h-72 w-72 rounded-full bg-primary/5 blur-[100px] sm:top-32"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-96 w-full max-w-md bg-[radial-gradient(ellipse_at_70%_80%,rgba(169,146,89,0.07),transparent_55%)]"
          aria-hidden
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <RevealOnScroll>
              <SectionBadge className="mb-5">Kit · Visual 3D · Temporada 01</SectionBadge>
              <h2 className="font-heading text-4xl font-normal uppercase leading-[0.95] tracking-wide text-white sm:text-5xl lg:text-6xl">
                La camiseta de nuestra historia.
              </h2>
            </RevealOnScroll>

            <RevealOnScroll
              className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground sm:text-xl"
              delay={0.06}
            >
              {kitFuturistNarrative.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="font-medium text-rz-cream/90">
                Reebok × {clubName}
              </p>
            </RevealOnScroll>

            <RevealOnScroll className="mt-10" delay={0.1}>
              <InscripcionButton
                label="Inscribirme en convocatorias"
                variant="outline"
                className="border-primary/35 bg-primary/5 text-sm font-semibold uppercase tracking-wide text-primary hover:bg-primary/15"
              />
            </RevealOnScroll>

            <RevealOnScroll className="mt-12" delay={0.12}>
              <Separator className="bg-white/10" />
              <ul className="mt-8 grid list-none gap-3 sm:grid-cols-2">
                {kitTechnicalFeatures.map((line) => (
                  <li
                    key={line}
                    className="relative pl-5 text-sm leading-snug text-muted-foreground before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>
          </div>

          <RevealOnScroll className="relative" delay={0.08}>
            <JerseyKitStage
              lightboxOpen={lightboxOpen}
              onOpenLightbox={() => setLightboxOpen(true)}
            />
          </RevealOnScroll>
        </div>

        <div className="mt-16 border-t border-white/10 pt-16 lg:mt-20 lg:pt-20">
          <RevealOnScroll className="text-center">
            <h3 className="font-heading text-2xl font-normal uppercase tracking-wide text-white sm:text-3xl">
              Lo que llevas puesto
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Cuatro ideas que atraviesan el diseño del kit y la historia del club.
            </p>
          </RevealOnScroll>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kitIdentityPillars.map((item, i) => (
              <RevealOnScroll key={item.title} delay={0.05 * i}>
                <div className="group h-full rounded-2xl border border-white/[0.07] bg-[#121215]/80 p-5 ring-1 ring-white/[0.04] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:bg-[#15151a] hover:shadow-[0_20px_48px_-16px_rgba(169,146,89,0.12)] motion-reduce:hover:translate-y-0">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="size-5" aria-hidden />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-normal uppercase tracking-wide text-white">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        src={kitImagePath}
        alt={kitImageAlt}
        unoptimized
      />
    </section>
  );
}
