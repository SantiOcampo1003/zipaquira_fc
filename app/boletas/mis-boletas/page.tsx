import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MisBoletasSection } from "@/components/stadium/MisBoletasSection";

export default function MisBoletasPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-[#0b0b0d]">
        <MisBoletasSection />
      </main>
      <Footer />
    </>
  );
}
