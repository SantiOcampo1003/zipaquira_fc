import { redirect } from "next/navigation";
import { AnimatedMarquee } from "@/components/AnimatedMarquee";
import { CommemorativeJerseySection } from "@/components/CommemorativeJerseySection";
import { ConvocatoriaFemeninaSection } from "@/components/ConvocatoriaFemeninaSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionDivider } from "@/components/SectionDivider";

type HomeProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { token } = await searchParams;

  // Links de abonos enviados antes de mover la silletería a /tribuna
  // seguían usando /?token=XXX#silleteria — los redirigimos para que no queden rotos.
  if (token) {
    redirect(`/tribuna?token=${encodeURIComponent(token)}`);
  }

  return (
    <>
      <Header />
      <main id="inicio" className="overflow-x-clip">
        <ConvocatoriaFemeninaSection />
        <SectionDivider />
        <CommemorativeJerseySection />
        <AnimatedMarquee />
      </main>
      <Footer />
    </>
  );
}
