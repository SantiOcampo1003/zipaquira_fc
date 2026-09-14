import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlayersSection } from "@/components/PlayersSection";

export default function JugadoresPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <PlayersSection />
      </main>
      <Footer />
    </>
  );
}
