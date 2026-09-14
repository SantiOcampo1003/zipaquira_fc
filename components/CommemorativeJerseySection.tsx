"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { JerseyFlipCard } from "@/components/JerseyFlipCard";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  jerseyOrderCtaLabel,
  jerseyOrderHeadline,
  jerseyOrderPrice,
  jerseyOrderSubheadline,
  jerseySizes,
  whatsappPhone,
} from "@/lib/brand";
import { handleSubmitJerseyOrder } from "@/lib/leads";
import { formatCop } from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

const jerseyOrderSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre es obligatorio" }),
  phone: z.string().trim().min(7, { message: "El celular es obligatorio" }),
  email: z.string().trim().email({ message: "Correo inválido" }).optional().or(z.literal("")),
  size: z.enum(jerseySizes),
  quantity: z.number().int().min(1).max(10),
});

type JerseyOrderFormValues = z.infer<typeof jerseyOrderSchema>;

const fieldClassName = cn(
  "h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-base text-black outline-none",
  "placeholder:text-black/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40",
  "aria-invalid:border-destructive md:text-sm"
);

function buildWhatsappMessage(values: JerseyOrderFormValues): string {
  const total = jerseyOrderPrice * values.quantity;
  const lines = [
    "Hola! Quiero comprar la camiseta conmemorativa de hincha oficial.",
    `Nombre: ${values.fullName}`,
    `Talla: ${values.size}`,
    `Cantidad: ${values.quantity}`,
    `Total: ${formatCop(total)}`,
  ];
  return lines.join("\n");
}

export function CommemorativeJerseySection() {
  const [success, setSuccess] = useState(false);

  const form = useForm<JerseyOrderFormValues>({
    resolver: zodResolver(jerseyOrderSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      size: "M",
      quantity: 1,
    },
  });

  const quantity = form.watch("quantity");
  const size = form.watch("size");
  const total = jerseyOrderPrice * quantity;

  async function onSubmit(data: JerseyOrderFormValues) {
    try {
      await handleSubmitJerseyOrder(data);
      const message = buildWhatsappMessage(data);
      window.open(`https://wa.me/57${whatsappPhone}?text=${encodeURIComponent(message)}`, "_blank");
      setSuccess(true);
      form.reset({ fullName: "", phone: "", email: "", size: "M", quantity: 1 });
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "No pudimos guardar tu pedido. Intenta de nuevo.",
      });
    }
  }

  const busy = form.formState.isSubmitting;

  return (
    <section
      id="camiseta-conmemorativa"
      className="rz-section scroll-mt-[3.5rem] bg-gradient-to-b from-[#121215] via-[#09110d] to-[#121215] pt-6 sm:scroll-mt-16 sm:pt-8"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <SectionBadge>Hincha oficial</SectionBadge>
          <h2 className="rz-h2 mt-3 text-balance sm:mt-4">
            {jerseyOrderHeadline}
            <span className="mt-1 block text-primary">{jerseyOrderSubheadline}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Elige tu talla y cantidad. Al confirmar, guardamos tu pedido y se abre WhatsApp para
            cerrar el pago y la entrega directamente con el club.
          </p>
          <Separator className="mx-auto mt-4 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <RevealOnScroll className="flex justify-center">
            <JerseyFlipCard />
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="rounded-2xl border border-primary/25 bg-[#18181B]/90 p-4 shadow-card sm:p-6">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-8 text-center"
                    role="status"
                  >
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="size-8" aria-hidden />
                    </div>
                    <p className="font-heading text-xl tracking-wide text-white sm:text-2xl">
                      ¡Pedido guardado!
                    </p>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Te abrimos WhatsApp para cerrar el pago y la entrega. Si no se abrió, escríbenos
                      directo al {whatsappPhone}.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 border-white/15 bg-transparent text-white hover:bg-white/10"
                      onClick={() => setSuccess(false)}
                    >
                      Hacer otro pedido
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3"
                    noValidate
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-heading text-sm uppercase tracking-wide text-muted-foreground">
                        Precio unidad
                      </span>
                      <span className="font-heading text-2xl text-primary">
                        {formatCop(jerseyOrderPrice)}
                      </span>
                    </div>

                    {form.formState.errors.root ? (
                      <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                    ) : null}

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Talla <span className="text-primary">*</span>
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {jerseySizes.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => form.setValue("size", option, { shouldValidate: true })}
                            className={cn(
                              "h-10 rounded-lg border font-heading text-sm uppercase tracking-wide transition-colors",
                              size === option
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-white/15 bg-rz-cream/5 text-white/70 hover:border-primary/40"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Cantidad</Label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            form.setValue("quantity", Math.max(1, quantity - 1), {
                              shouldValidate: true,
                            })
                          }
                          className="flex size-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-primary/40"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-8 text-center font-heading text-lg text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            form.setValue("quantity", Math.min(10, quantity + 1), {
                              shouldValidate: true,
                            })
                          }
                          className="flex size-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-primary/40"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jersey-fullName" className="text-muted-foreground">
                        Nombre completo <span className="text-primary">*</span>
                      </Label>
                      <input
                        id="jersey-fullName"
                        autoComplete="name"
                        placeholder="Como aparece en tu documento"
                        className={fieldClassName}
                        {...form.register("fullName")}
                        aria-invalid={!!form.formState.errors.fullName}
                        aria-required
                      />
                      {form.formState.errors.fullName ? (
                        <p className="text-sm text-destructive" role="alert">
                          {form.formState.errors.fullName.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="jersey-phone" className="text-muted-foreground">
                          Celular / WhatsApp <span className="text-primary">*</span>
                        </Label>
                        <input
                          id="jersey-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="300 000 0000"
                          className={fieldClassName}
                          {...form.register("phone")}
                          aria-invalid={!!form.formState.errors.phone}
                          aria-required
                        />
                        {form.formState.errors.phone ? (
                          <p className="text-sm text-destructive" role="alert">
                            {form.formState.errors.phone.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jersey-email" className="text-muted-foreground">
                          Correo (opcional)
                        </Label>
                        <input
                          id="jersey-email"
                          type="email"
                          autoComplete="email"
                          placeholder="correo@ejemplo.com"
                          className={fieldClassName}
                          {...form.register("email")}
                          aria-invalid={!!form.formState.errors.email}
                        />
                        {form.formState.errors.email ? (
                          <p className="text-sm text-destructive" role="alert">
                            {form.formState.errors.email.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                      <span className="font-heading text-sm uppercase tracking-wide text-muted-foreground">
                        Total
                      </span>
                      <span className="font-heading text-2xl text-primary">{formatCop(total)}</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-12 w-full bg-primary text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Guardando...
                        </>
                      ) : (
                        jerseyOrderCtaLabel
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
