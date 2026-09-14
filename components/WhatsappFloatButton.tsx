"use client";

import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/brand";

export function WhatsappFloatButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" aria-hidden />
      <MessageCircle className="relative size-7" strokeWidth={2} aria-hidden />
    </a>
  );
}
