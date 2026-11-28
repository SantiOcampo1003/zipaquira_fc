import { BetssonReview } from "@/components/admin/BetssonReview";

export const metadata = {
  title: "Betsson · Admin · Zipaquirá F.C.",
  robots: "noindex, nofollow",
};

export default function AdminBetssonPage() {
  return (
    <main className="min-h-screen bg-background">
      <BetssonReview />
    </main>
  );
}
