"use client";

import { MapPin, Swords, Trophy, Users } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import { TicketInterestForm } from "@/components/TicketInterestForm";
import {
  clubName,
  matchChallengeBody,
  matchChallengeHeadline,
  matchChallengePunchline,
  matchCompetition,
  matchHeadline,
  matchOpponent,
  matchOpponentDetail,
  matchRole,
  matchTicketFormBody,
  matchTicketFormTitle,
  matchVenue,
} from "@/lib/brand";

const facts = [
  {
    icon: Trophy,
    label: "Competición",
    value: matchCompetition,
  },
  {
    icon: Swords,
    label: "Rival",
    value: `${matchOpponent} · ${matchOpponentDetail}`,
  },
  {
    icon: MapPin,
    label: "Escenario",
    value: matchVenue,
  },
  {
    icon: Users,
    label: "Condición",
    value: matchRole,
  },
] as const;

export function PartidoInauguralSection() {
  return (
    <section
      id="partido"
      className="rz-section scroll-mt-[3.5rem] border-t border-primary/25 bg-gradient-to-b from-[#121215] via-[#0e1210] to-[#121215] sm:scroll-mt-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <SectionBadge>{matchHeadline} · {matchCompetition}</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">
            {matchChallengeHeadline}
            <span className="mt-2 block text-primary">{matchChallengePunchline}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
            {matchChallengeBody}
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, i) => (
            <RevealOnScroll key={fact.label} delay={0.05 * i}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#18181B]/70 p-5 text-center ring-1 ring-white/[0.04]">
                <fact.icon className="mx-auto size-5 text-primary" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {fact.label}
                </p>
                <p className="font-heading text-sm font-normal uppercase leading-snug tracking-wide text-white">
                  {fact.value}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-12" delay={0.08}>
          <div
            id="boletas"
            className="grid scroll-mt-[4.5rem] gap-8 sm:scroll-mt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12"
          >
            <div>
              <h3 className="font-heading text-xl font-normal uppercase tracking-wide text-white sm:text-2xl">
                {matchTicketFormTitle}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {matchTicketFormBody}
              </p>
              <p className="mt-6 font-heading text-base uppercase tracking-wide text-rz-cream/90 sm:text-lg">
                Zipaquirá no es un equipo más.
                <span className="mt-1 block text-primary">Es una ciudad entera en la tribuna.</span>
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {clubName} vs {matchOpponent} · {matchVenue} · {matchRole}
              </p>
            </div>
            <TicketInterestForm />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
