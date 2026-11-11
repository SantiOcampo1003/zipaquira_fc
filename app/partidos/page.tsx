import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MatchesSection } from "@/components/MatchesSection";
import { SectionDivider } from "@/components/SectionDivider";
import { StoryCTASection } from "@/components/StoryCTASection";

export default function PartidosPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <MatchesSection />
        <SectionDivider />
        <StoryCTASection />
      </main>
      <Footer />
    </>
  );
}
