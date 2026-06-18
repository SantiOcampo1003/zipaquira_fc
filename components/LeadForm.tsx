"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { clubName } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { handleSubmitLead } from "@/lib/leads";

const interestValues = [
  "hincha",
  "patrocinador",
  "jugador",
  "voluntario",
  "aliado",
  "medio_prensa",
] as const;

const interestLabels: Record<(typeof interestValues)[number], string> = {
  hincha: "Hincha",
  patrocinador: "Patrocinador",
  jugador: "Jugador",
  voluntario: "Voluntario",
  aliado: "Aliado",
  medio_prensa: "Medio / prensa",
};

const leadSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio"),
  whatsapp: z.string().min(1, "El WhatsApp es obligatorio"),
  email: z.string().email("Ingresa un email válido"),
  neighborhood: z.string().optional(),
  interestType: z.enum(interestValues, {
    message: "Selecciona un tipo de interés",
  }),
  message: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadForm() {
  const [success, setSuccess] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: "",
      whatsapp: "",
      email: "",
      neighborhood: "",
      interestType: undefined,
      message: "",
    },
  });

  async function onSubmit(data: LeadFormValues) {
    setSuccess(false);
    try {
      await handleSubmitLead(data);
      setSuccess(true);
      form.reset({
        fullName: "",
        whatsapp: "",
        email: "",
        neighborhood: "",
        interestType: undefined,
        message: "",
      });
    } catch {
      form.setError("root", { message: "No pudimos enviar. Intenta de nuevo." });
    }
  }

  const busy = form.formState.isSubmitting;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#18181B]/90 p-6 shadow-card sm:p-8">
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
              ¡Bienvenido a la comunidad fundadora de {clubName}!
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pronto conocerás los próximos pasos. Revisa tu correo y WhatsApp.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setSuccess(false)}
            >
              Enviar otro registro
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {form.formState.errors.root ? (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-muted-foreground">
                Nombre completo <span className="text-primary">*</span>
              </Label>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-11 border-white/10 bg-background/80 text-white placeholder:text-muted-foreground/70"
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

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-muted-foreground">
                  WhatsApp <span className="text-primary">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+57 ..."
                  className="h-11 border-white/10 bg-background/80 text-white placeholder:text-muted-foreground/70"
                  {...form.register("whatsapp")}
                  aria-invalid={!!form.formState.errors.whatsapp}
                  aria-required
                />
                {form.formState.errors.whatsapp ? (
                  <p className="text-sm text-destructive" role="alert">
                    {form.formState.errors.whatsapp.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email <span className="text-primary">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className="h-11 border-white/10 bg-background/80 text-white placeholder:text-muted-foreground/70"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-muted-foreground">
                Barrio o zona
              </Label>
              <Input
                id="neighborhood"
                placeholder="Opcional"
                className="h-11 border-white/10 bg-background/80 text-white placeholder:text-muted-foreground/70"
                {...form.register("neighborhood")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Tipo de interés <span className="text-primary">*</span>
              </Label>
              <Controller
                control={form.control}
                name="interestType"
                render={({ field }) => (
                  <Select value={field.value ?? null} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger
                      className="h-11 w-full min-w-0 border-white/10 bg-background/80 text-left text-white data-placeholder:text-muted-foreground"
                      aria-invalid={!!form.formState.errors.interestType}
                      aria-required
                    >
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#18181B] text-white">
                      {interestValues.map((v) => (
                        <SelectItem key={v} value={v}>
                          {interestLabels[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.interestType ? (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.interestType.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-muted-foreground">
                Mensaje <span className="text-muted-foreground/70">(opcional)</span>
              </Label>
              <Textarea
                id="message"
                rows={4}
                placeholder="Cuéntanos cómo quieres sumarte..."
                className="min-h-[120px] resize-y border-white/10 bg-background/80 text-white placeholder:text-muted-foreground/70"
                {...form.register("message")}
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto sm:min-w-[260px]"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                "Únete a la comunidad fundadora"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
