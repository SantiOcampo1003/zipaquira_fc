"use client";

import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function JerseyFlipCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group relative aspect-[4/5] h-[380px] w-auto max-w-full cursor-pointer [perspective:1600px] sm:h-[440px] lg:h-[520px]"
        aria-label="Girar la camiseta para ver el otro lado"
      >
        <motion.div
          className="relative size-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-primary/25 bg-black/20 [backface-visibility:hidden]">
            <Image
              src="/images/camiseta-conmemorativa-frente.png"
              alt="Camiseta conmemorativa de hincha oficial — frente"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-primary/25 bg-black/20 [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <Image
              src="/images/camiseta-conmemorativa-espalda.png"
              alt="Camiseta conmemorativa de hincha oficial — espalda"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
            />
          </div>
        </motion.div>

        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-primary/30 bg-black/60 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <RotateCw className="size-3.5" aria-hidden />
          {flipped ? "Espalda" : "Frente"}
        </span>
      </button>
      <p className="text-center text-xs text-muted-foreground">Toca la camiseta para ver el otro lado</p>
    </div>
  );
}
