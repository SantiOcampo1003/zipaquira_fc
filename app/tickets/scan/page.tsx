import { Suspense } from "react";
import { TicketScanner } from "@/components/stadium/TicketScanner";

export default function TicketScanPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d]">
      <Suspense fallback={null}>
        <TicketScanner />
      </Suspense>
    </main>
  );
}
