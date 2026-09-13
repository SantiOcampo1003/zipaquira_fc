import { Suspense } from "react";
import { AnimatedMarquee } from "@/components/AnimatedMarquee";
import { CommemorativeJerseySection } from "@/components/CommemorativeJerseySection";
import { CommunityFunnelSection } from "@/components/CommunityFunnelSection";
import { Footer } from "@/components/Footer";
import { GalleryConceptSection } from "@/components/GalleryConceptSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { JerseyKitSection } from "@/components/JerseyKitSection";
import { MatchesSection } from "@/components/MatchesSection";
import { ManifestoSection } from "@/components/ManifestoSection";
import { NewGenerationSection } from "@/components/NewGenerationSection";
import { PartidoInauguralSection } from "@/components/PartidoInauguralSection";
import { PlayersSection } from "@/components/PlayersSection";
import { SectionDivider } from "@/components/SectionDivider";
import { SponsorsSection } from "@/components/SponsorsSection";
import { StadiumSeatingSection } from "@/components/stadium/StadiumSeatingSection";
import { StoryCTASection } from "@/components/StoryCTASection";
import { ValuesGridSection } from "@/components/ValuesGridSection";
import { showJerseyOrderSection, showKitSection } from "@/lib/brand";

export default function Home() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <HeroSection />
        <AnimatedMarquee />
        <SectionDivider />
        <Suspense fallback={null}>
          <StadiumSeatingSection />
        </Suspense>
        <SectionDivider />
        <PartidoInauguralSection />
        <SectionDivider />
        <MatchesSection />
        {showKitSection ? (
          <>
            <SectionDivider />
            <JerseyKitSection />
          </>
        ) : null}
        {showJerseyOrderSection ? (
          <>
            <SectionDivider />
            <CommemorativeJerseySection />
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
