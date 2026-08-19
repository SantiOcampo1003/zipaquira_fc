import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin · Zipaquirá F.C.",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <AdminDashboard />
    </main>
  );
}
