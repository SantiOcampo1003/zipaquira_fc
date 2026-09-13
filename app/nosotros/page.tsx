import { CommunityFunnelSection } from "@/components/CommunityFunnelSection";
import { Footer } from "@/components/Footer";
import { GalleryConceptSection } from "@/components/GalleryConceptSection";
import { Header } from "@/components/Header";
import { ManifestoSection } from "@/components/ManifestoSection";
import { NewGenerationSection } from "@/components/NewGenerationSection";
import { SectionDivider } from "@/components/SectionDivider";
import { ValuesGridSection } from "@/components/ValuesGridSection";

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <ManifestoSection />
        <SectionDivider />
        <NewGenerationSection />
        <SectionDivider />
        <ValuesGridSection />
        <SectionDivider />
        <CommunityFunnelSection />
        <SectionDivider />
        <GalleryConceptSection />
      </main>
      <Footer />
    </>
  );
}
