import { useState } from "react";
import { GradientBackground } from "./components/GradientBackground";
import { CursorSpotlight } from "./components/CursorSpotlight";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { TrustSection } from "./components/TrustSection";
import { Features } from "./components/Features";
import { VisualShowcase } from "./components/VisualShowcase";
import { VisualImpact } from "./components/VisualImpact";
import { HowItWorks } from "./components/HowItWorks";
import { Pricing } from "./components/Pricing";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { ContactModal } from "./ContactModal";

export function LandingPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const openContact = () => setIsContactOpen(true);
  const closeContact = () => setIsContactOpen(false);

  return (
    <div className="min-h-screen bg-[#000000] text-white antialiased relative overflow-x-hidden">
      <GradientBackground />
      <CursorSpotlight />
      <div className="relative z-10">
        <Navbar onOpenContact={openContact} />
        <Hero onOpenContact={openContact} />
        <TrustSection />
        <Features />
        <VisualShowcase />
        <VisualImpact />
        <HowItWorks />
        <Pricing onOpenContact={openContact} />
        <FinalCTA />
        <Footer onOpenContact={openContact} />
      </div>
      <ContactModal isOpen={isContactOpen} onClose={closeContact} />
    </div>
  );
}
