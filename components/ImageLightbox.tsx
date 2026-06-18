"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  /** Texto mínimo opcional bajo la imagen (una línea) */
  caption?: string;
  className?: string;
  /** Evita `/_next/image` (útil si sustituyes el PNG en `public/` y ves caché vieja). */
  unoptimized?: boolean;
};

/**
 * Lightbox centrado casi en toda la pantalla: prioridad visual para la imagen.
 */
export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
  caption,
  className,
  unoptimized = false,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[96dvh] w-[min(96vw,1440px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border border-white/10 bg-[#050505] p-0 shadow-2xl ring-1 ring-white/10 sm:max-w-[min(96vw,1440px)] sm:rounded-lg",
          className
        )}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative flex min-h-[min(86dvh,820px)] w-full items-center justify-center bg-black sm:min-h-[min(88dvh,880px)]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain object-center p-2 sm:p-4"
            sizes="100vw"
            priority={open}
            unoptimized={unoptimized}
          />
        </div>
        {caption ? (
          <p className="border-t border-white/10 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
            {caption}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
