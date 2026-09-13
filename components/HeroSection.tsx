"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Maximize2 } from "lucide-react";
import { useState } from "react";
import { ClubCrest, ESCUDO_PATH, escudoAlt } from "@/components/ClubCrest";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ImageLightbox";
import { SectionBadge } from "@/components/SectionBadge";
import { fadeIn, fadeInUp, staggerCinematic } from "@/lib/motion";
import {
  brandIdentityLabel,
  brandImpactHeading,
  brandImpactPillars,
  brandMissionStatement,
  brandOriginStatement,
  brandRootValues,
  brandTagline,
  matchChallengeBody,
  matchChallengeHeadline,
  matchChallengePunchline,
  matchCompetition,
  matchHeadline,
  matchOpponent,
  matchRole,
  matchTicketCta,
  matchVenue,
} from "@/lib/brand";
import { scrollToId } from "@/lib/scroll";

/** Posiciones fijas (SSR-safe) — polvo de sal / cristales. */
const SALT_SPECKS: { l: number; t: number; s: number; dur: number; delay: number }[] = [
  { l: 8, t: 22, s: 2, dur: 13, delay: 0 },
  { l: 18, t: 8, s: 2, dur: 15, delay: 1.2 },
  { l: 72, t: 14, s: 3, dur: 11, delay: 0.4 },
  { l: 88, t: 28, s: 2, dur: 16, delay: 2.1 },
  { l: 42, t: 6, s: 2, dur: 14, delay: 0.8 },
  { l: 55, t: 18, s: 2, dur: 12, delay: 1.6 },
  { l: 28, t: 38, s: 3, dur: 17, delay: 0.2 },
  { l: 65, t: 42, s: 2, dur: 13, delay: 2.8 },
  { l: 12, t: 55, s: 2, dur: 15, delay: 1.1 },
  { l: 80, t: 58, s: 2, dur: 14, delay: 0.6 },
  { l: 50, t: 62, s: 3, dur: 18, delay: 3 },
  { l: 35, t: 72, s: 2, dur: 12, delay: 1.4 },
  { l: 92, t: 70, s: 2, dur: 16, delay: 2.2 },
  { l: 6, t: 78, s: 2, dur: 14, delay: 0.9 },
];

export function HeroSection() {
  const [escudoOpen, setEscudoOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-background pb-14 pt-5 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-16deg, transparent, transparent 28px, rgba(169,146,89,0.35) 28px, rgba(169,146,89,0.35) 29px)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="pointer-events-none absolute -left-24 top-1/4 size-[420px] rounded-full bg-rz-forest/40 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[380px] rounded-full bg-rz-burgundy/20 blur-[90px]" />
      <div className="pointer-events-none absolute left-1/2 top-[18%] h-[min(55vh,520px)] w-[min(90vw,640px)] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[120px]" aria-hidden />

      {!reduce ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {SALT_SPECKS.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-primary/35 shadow-[0_0_8px_rgba(169,146,89,0.35)] animate-rz-salt-drift"
              style={{
                left: `${p.l}%`,
                top: `${p.t}%`,
                width: p.s,
                height: p.s,
                ["--drift-dur" as string]: `${p.dur}s`,
                ["--drift-delay" as string]: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8">
        <motion.div
          variants={staggerCinematic}
          initial="hidden"
          animate="visible"
          className="flex min-w-0 flex-col gap-4 sm:gap-6"
        >
          <motion.div variants={fadeInUp}>
            <SectionBadge>
              {matchHeadline} · {matchCompetition}
            </SectionBadge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-heading text-[2.35rem] font-normal uppercase leading-[0.95] tracking-wide text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-7xl"
            style={{ textShadow: "0 0 80px rgba(169,146,89,0.12)" }}
          >
            <span className="text-white">Zipaquirá</span>
            <span className="mt-2 block text-primary">F.C.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="max-w-xl font-heading text-sm font-semibold uppercase leading-snug tracking-[0.08em] text-rz-cream sm:text-lg sm:tracking-[0.12em] lg:text-xl"
          >
            {brandTagline}
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="font-heading text-xl font-normal uppercase leading-tight tracking-wide text-rz-cream/95 sm:text-2xl lg:text-4xl"
          >
            {matchChallengeHeadline}
            <span className="mt-1 block text-white">{matchChallengePunchline}</span>
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg"
          >
            {matchChallengeBody}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="max-w-xl space-y-1.5 text-sm text-rz-cream/90 sm:text-base"
          >
            <p>
              <span className="font-medium text-white">vs {matchOpponent}</span> · {matchVenue}
            </p>
            <p className="text-muted-foreground">
              {matchCompetition} · {matchRole}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="rz-cta-row sm:items-center">
            <Button
              type="button"
              onClick={() => scrollToId("boletas")}
              className="h-12 w-full gap-2 bg-primary px-6 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-lift transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.03] hover:bg-primary/92 hover:shadow-[0_0_36px_-4px_rgba(169,146,89,0.55)] active:scale-[0.98] sm:w-auto motion-reduce:hover:scale-100 motion-reduce:hover:shadow-lift"
            >
              {matchTicketCta}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => scrollToId("nosotros")}
              className="h-12 w-full border-white/15 bg-white/5 px-6 text-sm font-semibold uppercase tracking-wide text-white transition-[transform,box-shadow,background-color] duration-300 ease-out hover:scale-[1.02] hover:bg-white/10 hover:shadow-[0_0_28px_-8px_rgba(169,146,89,0.2)] active:scale-[0.99] sm:w-auto motion-reduce:hover:scale-100"
            >
              Conocer el club
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </motion.div>

          <motion.p variants={fadeIn} className="text-sm text-muted-foreground">
            Deja tus datos y te avisamos cuando salga la info de boletas.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full min-w-0 max-w-md lg:mx-0 lg:max-w-none"
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-rz-forest via-[#0f2e14] to-background p-1 shadow-card">
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(169,146,89,0.4) 0%, transparent 45%), repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 19px)",
              }}
            />
            <div className="relative rounded-[0.9rem] bg-[#0e0e12]/90 p-4 sm:p-6">
              <div className="flex flex-col items-center border-b border-white/10 pb-5">
                <div className="relative mx-auto w-full max-w-[min(100%,220px)] sm:max-w-[260px]">
                  {!reduce ? (
                    <motion.div
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
                      animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.96, 1.05, 0.96] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                      aria-hidden
                    />
                  ) : (
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setEscudoOpen(true)}
                    className="group relative z-10 mx-auto w-full overflow-hidden rounded-xl border border-primary/20 bg-[#050508] shadow-[0_0_40px_rgba(169,146,89,0.08)] transition-[border-color,box-shadow] duration-300 hover:border-primary/45 hover:shadow-[0_0_56px_rgba(169,146,89,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e12]"
                    aria-label="Ver escudo a tamaño completo"
                    aria-haspopup="dialog"
                    aria-expanded={escudoOpen}
                  >
                    <motion.div
                      className="relative aspect-square w-full"
                      animate={reduce ? undefined : { scale: [1, 1.018, 1] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ClubCrest
                        variant="hero"
                        priority
                        className="h-full w-full rounded-none border-0 bg-transparent shadow-none transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50 group-hover:opacity-70" />
                      <div className="pointer-events-none absolute right-2 top-2 sm:right-2.5 sm:top-2.5" aria-hidden>
                        <span className="inline-flex rounded-full border border-primary/40 bg-black/55 p-1.5 text-primary shadow-[0_0_16px_rgba(169,146,89,0.18)] backdrop-blur-sm sm:p-2">
                          <Maximize2 className="size-3.5 sm:size-4" strokeWidth={2.25} />
                        </span>
                      </div>
                    </motion.div>
                  </button>
                </div>
                <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-primary">
                  {brandIdentityLabel}
                </p>
                <p className="mt-1.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                  Zipaquirá, Colombia
                </p>
                <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-rz-cream/90 sm:text-sm">
                  {brandOriginStatement}
                </p>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {brandMissionStatement}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {brandRootValues.map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary"
                  >
                    {value}
                  </span>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
                  {brandImpactHeading}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {brandImpactPillars.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-2.5 text-center ring-1 ring-white/[0.04]"
                    >
                      <p className="font-heading text-[0.65rem] font-normal uppercase leading-snug tracking-wide text-white sm:text-[0.7rem]">
                        {pillar.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ImageLightbox
        open={escudoOpen}
        onOpenChange={setEscudoOpen}
        src={ESCUDO_PATH}
        alt={escudoAlt}
        unoptimized
      />
    </section>
  );
}
