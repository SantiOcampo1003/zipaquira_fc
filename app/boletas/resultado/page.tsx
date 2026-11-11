import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BoletaResultadoSection } from "@/components/stadium/BoletaResultadoSection";

export default function BoletaResultadoPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-[#0b0b0d]">
        <Suspense fallback={null}>
          <BoletaResultadoSection />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
