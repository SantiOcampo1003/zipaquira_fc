import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SponsorsSection } from "@/components/SponsorsSection";

export default function PatrocinadoresPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <SponsorsSection />
      </main>
      <Footer />
    </>
  );
}
