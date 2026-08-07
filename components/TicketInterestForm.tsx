"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { handleSubmitTicketInterest } from "@/lib/leads";
import { cn } from "@/lib/utils";

const ticketSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre es obligatorio" }),
  documentId: z
    .string()
    .trim()
    .min(5, { message: "Ingresa tu cédula" })
    .regex(/^[0-9.\-\s]+$/, { message: "Solo números" }),
  phone: z.string().trim().min(7, { message: "El teléfono es obligatorio" }),
  email: z.string().trim().email({ message: "Ingresa un correo válido" }),
  city: z.string().trim().optional(),
});

export type TicketInterestFormValues = z.infer<typeof ticketSchema>;

const fieldClassName = cn(
  "h-11 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-base text-black outline-none",
  "placeholder:text-black/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40",
  "aria-invalid:border-destructive md:text-sm"
);

export function TicketInterestForm() {
  const [success, setSuccess] = useState(false);

  const form = useForm<TicketInterestFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      fullName: "",
      documentId: "",
      phone: "",
      email: "",
      city: "",
    },
  });

  async function onSubmit(data: TicketInterestFormValues) {
    setSuccess(false);
    try {
      await handleSubmitTicketInterest(data);
      setSuccess(true);
      form.reset();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "No pudimos enviar. Intenta de nuevo.",
      });
    }
  }

  const busy = form.formState.isSubmitting;

  return (
    <div className="rounded-2xl border border-primary/25 bg-[#18181B]/90 p-5 shadow-card sm:p-8">
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
              ¡Ya estás en la lista!
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pronto te enviaremos la información de boletas por correo y WhatsApp. Prepárate para
              vestir de verde en El Campín.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setSuccess(false)}
            >
              Registrar a otra persona
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {form.formState.errors.root ? (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-muted-foreground">
                Nombre completo <span className="text-primary">*</span>
              </Label>
              <input
                id="fullName"
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentId" className="text-muted-foreground">
                  Cédula <span className="text-primary">*</span>
                </Label>
                <input
                  id="documentId"
                  inputMode="numeric"
                  placeholder="Número de documento"
                  className={fieldClassName}
                  {...form.register("documentId")}
                  aria-invalid={!!form.formState.errors.documentId}
                  aria-required
                />
                {form.formState.errors.documentId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {form.formState.errors.documentId.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">
                  Teléfono / WhatsApp <span className="text-primary">*</span>
                </Label>
                <input
                  id="phone"
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
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Correo electrónico <span className="text-primary">*</span>
                </Label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className={fieldClassName}
                  {...form.register("email")}
                  aria-invalid={!!form.formState.errors.email}
                  aria-required
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive" role="alert">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-muted-foreground">
                  Ciudad
                </Label>
                <input
                  id="city"
                  autoComplete="address-level2"
                  placeholder="Zipaquirá (opcional)"
                  className={fieldClassName}
                  {...form.register("city")}
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Con estos datos te contactaremos cuando salga la información oficial de boletas. No es
              una compra todavía.
            </p>

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full bg-primary text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 sm:w-auto sm:min-w-[280px]"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                "Quiero vivir El Campín"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
