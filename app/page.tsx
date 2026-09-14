import { AnimatedMarquee } from "@/components/AnimatedMarquee";
import { CommemorativeJerseySection } from "@/components/CommemorativeJerseySection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main id="inicio" className="overflow-x-clip">
        <CommemorativeJerseySection />
        <AnimatedMarquee />
      </main>
      <Footer />
    </>
  );
}
