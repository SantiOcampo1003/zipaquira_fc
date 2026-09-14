import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StadiumSeatingSection } from "@/components/stadium/StadiumSeatingSection";

export default function TribunaPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <Suspense fallback={null}>
          <StadiumSeatingSection />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
