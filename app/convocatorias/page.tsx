import { ConvocatoriaFemeninaSection } from "@/components/ConvocatoriaFemeninaSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function ConvocatoriasPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <ConvocatoriaFemeninaSection />
      </main>
      <Footer />
    </>
  );
}
