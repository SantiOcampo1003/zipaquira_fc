"use client";

import { galleryPlaceholders } from "@/lib/landing-data";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export function GalleryConceptSection() {
  return (
    <section id="galeria" className="rz-section border-t border-white/[0.06] bg-[#121215]">
      <div className="rz-container">
        <RevealOnScroll className="max-w-2xl">
          <h2 className="rz-h2">
            Galería
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base lg:text-lg">
            Espacios reservados para la fotografía oficial: entrenamientos, ciudad, cantera e
            hinchada.
          </p>
        </RevealOnScroll>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {galleryPlaceholders.map((item, i) => (
            <RevealOnScroll key={item.label} delay={0.05 * i}>
              <div className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] bg-background p-6 ring-1 ring-white/[0.04]">
                <div
                  className="absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 20%, rgba(169,146,89,0.18), transparent 50%), linear-gradient(145deg, #0b2810 0%, #061a0a 45%, #0f2e14 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-25deg, transparent, transparent 14px, rgba(245,240,230,0.06) 14px, rgba(245,240,230,0.06) 15px)",
                  }}
                />
                <div className="relative">
                  <p className="font-heading text-xl font-normal uppercase tracking-wide text-white sm:text-2xl">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.hint}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
