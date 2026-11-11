import { CommemorativeJerseySection } from "@/components/CommemorativeJerseySection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function TiendaPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <CommemorativeJerseySection />
      </main>
      <Footer />
    </>
  );
}
