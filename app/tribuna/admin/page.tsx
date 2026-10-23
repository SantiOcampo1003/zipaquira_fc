import { Suspense } from "react";
import { AdminSeatManager } from "@/components/stadium/AdminSeatManager";

export default function TribunaAdminPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d]">
      <Suspense fallback={null}>
        <AdminSeatManager />
      </Suspense>
    </main>
  );
}
