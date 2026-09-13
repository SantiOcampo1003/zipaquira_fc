import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MatchesSection } from "@/components/MatchesSection";
import { PartidoInauguralSection } from "@/components/PartidoInauguralSection";
import { SectionDivider } from "@/components/SectionDivider";
import { StoryCTASection } from "@/components/StoryCTASection";

export default function PartidosPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <HeroSection />
        <SectionDivider />
        <PartidoInauguralSection />
        <SectionDivider />
        <MatchesSection />
        <SectionDivider />
        <StoryCTASection />
      </main>
      <Footer />
    </>
  );
}
