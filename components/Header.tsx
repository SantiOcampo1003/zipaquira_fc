"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Menu, X } from "lucide-react";
import { ClubCrest } from "@/components/ClubCrest";
import { convocatoriaFormUrl, clubNameUpper } from "@/lib/brand";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Convocatorias", id: "convocatorias" },
  { label: "Camiseta", id: "camiseta" },
  { label: "Nosotros", id: "nosotros" },
  { label: "Jugadores", id: "jugadores" },
  { label: "Patrocinadores", id: "patrocinadores" },
] as const;

const clubNameMain = clubNameUpper.replace(" F.C.", "");

function NavLink({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative whitespace-nowrap px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 transition-colors duration-300 hover:text-primary xl:px-3.5 xl:text-[11px]",
        className
      )}
    >
      <span className="relative z-[1]">{label}</span>
      <span
        className="pointer-events-none absolute inset-x-2.5 bottom-1.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100 xl:inset-x-3.5"
        aria-hidden
      />
    </button>
  );
}

function BrandLockup({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex shrink-0 items-center gap-3 text-left transition-opacity duration-300 hover:opacity-95 sm:gap-3.5"
      aria-label={`${clubNameUpper} — inicio`}
    >
      <ClubCrest
        priority
        sizes="52px"
        className="h-11 w-11 rounded-xl border border-primary/30 shadow-[0_0_24px_rgba(169,146,89,0.14)] ring-1 ring-white/[0.06] transition-[border-color,box-shadow,transform] duration-300 group-hover:border-primary/45 group-hover:shadow-[0_0_32px_rgba(169,146,89,0.22)] sm:h-12 sm:w-12"
      />
      <span className="hidden flex-col justify-center leading-none min-[380px]:flex">
        <span className="font-heading text-sm font-bold tracking-[0.08em] text-white sm:text-base lg:text-[17px]">
          {clubNameMain}
        </span>
        <span className="mt-0.5 font-heading text-[8px] font-semibold tracking-[0.28em] text-primary sm:mt-1 sm:text-[10px]">
          F.C.
        </span>
      </span>
    </button>
  );
}

function HeaderCta({ className, showIcon = false }: { className?: string; showIcon?: boolean }) {
  return (
    <a
      href={convocatoriaFormUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-primary/35 bg-primary px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_4px_22px_-6px_rgba(169,146,89,0.5)] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/55 hover:bg-[#b9a468] hover:shadow-[0_10px_32px_-6px_rgba(169,146,89,0.62)] active:translate-y-0 motion-reduce:hover:translate-y-0 sm:text-[11px]",
        className
      )}
    >
      Inscribirme
      {showIcon ? <ExternalLink className="size-3.5 shrink-0 opacity-90" aria-hidden /> : null}
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function go(id: string) {
    setOpen(false);
    scrollToId(id);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out",
        scrolled
          ? "border-white/[0.09] bg-[rgba(6,26,10,0.92)] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
          : "border-white/[0.04] bg-[rgba(6,26,10,0.62)] backdrop-blur-xl"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.03]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <BrandLockup onClick={() => go("inicio")} />

        <nav
          className="hidden flex-1 items-center justify-center lg:flex"
          aria-label="Principal"
        >
          {nav.map((item) => (
            <NavLink key={item.id} label={item.label} onClick={() => go(item.id)} />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <HeaderCta className="hidden h-8 px-3 text-[9px] min-[400px]:inline-flex sm:h-9 sm:px-5 sm:text-[11px]" />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 transition-[color,background-color,border-color] duration-300 hover:border-primary/30 hover:bg-white/[0.07] hover:text-primary lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="size-[18px]" strokeWidth={2} /> : <Menu className="size-[18px]" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            />

            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-white/[0.08] bg-[rgba(6,26,10,0.97)] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl lg:hidden"
            >
              <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
                <nav className="flex flex-col gap-0.5" aria-label="Móvil">
                  {nav.map((item, i) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.04 * i, duration: 0.3 }}
                      onClick={() => go(item.id)}
                      className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors duration-300 hover:bg-white/[0.04]"
                    >
                      <span className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-white/75 transition-colors duration-300 group-hover:text-primary">
                        {item.label}
                      </span>
                      <span className="h-px w-8 origin-right scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                    </motion.button>
                  ))}
                </nav>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.3 }}
                  className="mt-5 border-t border-white/[0.06] pt-5"
                >
                  <HeaderCta className="h-11 w-full text-xs" showIcon />
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Convocatorias · Ficha oficial del jugador
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
