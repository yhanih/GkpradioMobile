import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ProgramsSection } from "@/components/programs-section";
import { ListenSection } from "@/components/listen-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { FloatingAudioPlayer } from "@/components/floating-audio-player";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <AboutSection />
      <ProgramsSection />
      <ListenSection />
      <ContactSection />
      <Footer />
      <FloatingAudioPlayer />
    </main>
  );
}
