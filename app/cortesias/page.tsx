import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MatchSelectorSection } from "@/components/stadium/MatchSelectorSection";

export const metadata = { title: "Cortesías", robots: { index: false, follow: false } };

export default function CortesiasPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-[#0b0b0d]">
        <Suspense fallback={null}>
          <MatchSelectorSection forcedMode="cortesia" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
