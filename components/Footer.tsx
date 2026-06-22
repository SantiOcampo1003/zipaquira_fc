"use client";

import { MessageCircle } from "lucide-react";
import { ClubCrest } from "@/components/ClubCrest";
import { InscripcionButton } from "@/components/InscripcionButton";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { scrollToId } from "@/lib/scroll";
import { brandTagline, clubName, clubNameUpper, whatsappUrl } from "@/lib/brand";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const social = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/", icon: TikTokIcon },
  { label: "WhatsApp", href: whatsappUrl, icon: MessageCircle },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-background py-10 sm:py-14">
      <div className="rz-container">
        <RevealOnScroll className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:text-left">
          <div className="flex min-w-0 flex-col items-center sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <ClubCrest className="h-11 w-11 rounded-lg border border-primary/25 sm:h-14 sm:w-14" />
              <p className="font-heading text-lg tracking-[0.1em] text-white sm:text-2xl sm:tracking-[0.12em]">
                {clubNameUpper}
              </p>
            </div>
            <p className="mt-2 max-w-xs text-sm text-rz-cream/80">{brandTagline}</p>
            <button
              type="button"
              onClick={() => scrollToId("convocatorias")}
              className="mt-4 text-sm font-medium uppercase tracking-wide text-primary underline-offset-4 hover:underline"
            >
              Ver convocatorias
            </button>
            <InscripcionButton
              label="Inscribirme"
              showIcon={false}
              variant="link"
              className="mt-2 h-auto p-0 text-sm"
            />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-muted-foreground underline-offset-4 hover:text-white hover:underline"
            >
              Contacto
            </a>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Síguenos
            </p>
            <div className="flex gap-3">
              {social.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        <div className="mt-12 border-t border-white/[0.06] pt-8 text-center text-xs text-muted-foreground">
          © {year} {clubName}. Zipaquirá, Colombia.
        </div>
      </div>
    </footer>
  );
}
