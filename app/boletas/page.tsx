import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BoletaAuthGate } from "@/components/stadium/BoletaAuthGate";

export default function BoletasPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-[#0b0b0d]">
        <Suspense fallback={null}>
          <BoletaAuthGate />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
