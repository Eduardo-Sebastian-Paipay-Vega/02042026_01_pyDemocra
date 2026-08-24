import { useState } from "react";
import { Outlet } from "react-router";
import { GradientBackground } from "@/pages/landing/components/GradientBackground";
import { CursorSpotlight } from "@/pages/landing/components/CursorSpotlight";
import { Navbar } from "@/pages/landing/components/Navbar";
import { Footer } from "@/pages/landing/components/Footer";
import { ContactModal } from "@/pages/landing/ContactModal";

export function PublicLayout() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const openContact = () => setIsContactOpen(true);
  const closeContact = () => setIsContactOpen(false);

  return (
    <div className="min-h-screen bg-[#000000] text-white antialiased relative overflow-x-hidden flex flex-col">
      <GradientBackground />
      <CursorSpotlight />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar onOpenContact={openContact} />
        {/* Usamos pt-24 para compensar el Navbar fijo */}
        <main className="flex-grow pt-24 pb-16 flex flex-col">
          <Outlet />
        </main>
        <Footer onOpenContact={openContact} />
      </div>
      <ContactModal isOpen={isContactOpen} onClose={closeContact} />
    </div>
  );
}
