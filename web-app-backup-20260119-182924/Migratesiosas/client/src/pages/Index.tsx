import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedEpisodes from "@/components/FeaturedEpisodes";
import CommunityPreview from "@/components/CommunityPreview";
import SponsorCarousel from "@/components/SponsorCarousel";
import AudioPlayer from "@/components/AudioPlayer";
import PlatformLinks from "@/components/PlatformLinks";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16"> {/* Top padding for fixed header */}
        <HeroSection />

        <CommunityPreview />
        <PlatformLinks />

        {/* Sponsor Bar */}
        <SponsorCarousel />
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default Index;