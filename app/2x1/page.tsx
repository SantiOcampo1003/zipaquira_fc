import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MatchSelectorSection } from "@/components/stadium/MatchSelectorSection";

export const metadata = { title: "Venta 2x1", robots: { index: false, follow: false } };

export default function DosPorUnoPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-[#0b0b0d]">
        <Suspense fallback={null}>
          <MatchSelectorSection forcedMode="2x1" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
