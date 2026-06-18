import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { brandTagline, clubName, clubNameUpper, convocatoriaDateLabel } from "@/lib/brand";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Display: Montserrat semibold (manual · secundaria). Accia Piano requiere archivo local. */
const montserratDisplay = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${clubNameUpper} | ${brandTagline}`,
  description:
    `Convocatorias de jugadores de ${clubName} el ${convocatoriaDateLabel}. Completa la ficha oficial e inscríbete para representar a Zipaquirá.`,
  openGraph: {
    title: clubNameUpper,
    description: brandTagline,
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={cn(
          "relative min-h-screen bg-background font-sans antialiased",
          montserrat.variable,
          montserratDisplay.variable
        )}
      >
        <div
          className="rz-film-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.055] mix-blend-overlay"
          aria-hidden
        />
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  );
}
