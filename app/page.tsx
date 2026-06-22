import { AnimatedMarquee } from "@/components/AnimatedMarquee";
import { CommunityFunnelSection } from "@/components/CommunityFunnelSection";
import { ConvocatoriasSection } from "@/components/ConvocatoriasSection";
import { Footer } from "@/components/Footer";
import { GalleryConceptSection } from "@/components/GalleryConceptSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { JerseyKitSection } from "@/components/JerseyKitSection";
import { ManifestoSection } from "@/components/ManifestoSection";
import { NewGenerationSection } from "@/components/NewGenerationSection";
import { PlayersSection } from "@/components/PlayersSection";
import { SectionDivider } from "@/components/SectionDivider";
import { SponsorsSection } from "@/components/SponsorsSection";
import { StoryCTASection } from "@/components/StoryCTASection";
import { ValuesGridSection } from "@/components/ValuesGridSection";
import { showKitSection } from "@/lib/brand";

export default function Home() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <HeroSection />
        <SectionDivider />
        <ConvocatoriasSection />
        <SectionDivider />
        <AnimatedMarquee />
        {showKitSection ? (
          <>
            <SectionDivider />
            <JerseyKitSection />
          </>
        ) : null}
        <SectionDivider />
        <ManifestoSection />
        <SectionDivider />
        <NewGenerationSection />
        <SectionDivider />
        <ValuesGridSection />
        <SectionDivider />
        <StoryCTASection />
        <SectionDivider />
        <CommunityFunnelSection />
        <SectionDivider />
        <SponsorsSection />
        <SectionDivider />
        <PlayersSection />
        <SectionDivider />
        <GalleryConceptSection />
      </main>
      <Footer />
    </>
  );
}
