'use client';

import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { CustomCursor } from '@/components/CustomCursor';
import { MouseLight } from '@/components/MouseLight';
import { Navbar } from '@/components/Navbar';
import { ScrollyCanvas } from '@/components/ScrollyCanvas';
import { FlavourSection } from '@/components/FlavourSection';
import { BottleCraft } from '@/components/BottleCraft';
import { BrandPhilosophy } from '@/components/BrandPhilosophy';
import { Benefits } from '@/components/Benefits';
import { Gallery } from '@/components/Gallery';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { OrderModal } from '@/components/OrderModal';
import { VideoModal } from '@/components/VideoModal';
import { Flavour } from '@/lib/constants';
import { setLenisInstance, setLenisPaused } from '@/lib/lenis';

export function HomeExperience() {
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedFlavour, setSelectedFlavour] = useState<Flavour | null>(null);

  // Initialize Lenis smooth scroll with clean RAF cleanup and anchor support
  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const lenis = new Lenis({
      duration: isTouch ? 0.6 : 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.05,
      anchors: true,
    });

    setLenisInstance(lenis);
    let rafId = 0;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    setLenisPaused(isOrderOpen || isVideoOpen);
  }, [isOrderOpen, isVideoOpen]);

  const handleOpenOrderWithFlavour = (flavour?: Flavour) => {
    if (flavour) setSelectedFlavour(flavour);
    setIsOrderOpen(true);
  };

  return (
    <>
      {/* Luxury Custom Cursor */}
      <CustomCursor />

      {/* Ambient Mouse Radial Glow */}
      <MouseLight />

      {/* Navigation Bar */}
      <Navbar onOpenOrder={() => setIsOrderOpen(true)} />

      <main className="relative bg-elan-dark text-elan-cream min-h-screen selection:bg-elan-gold selection:text-elan-dark">
        {/* CHAPTER 01: Introduction & Cinematic Scrollytelling Film (PR folder sequence) */}
        <ScrollyCanvas />

        {/* CHAPTER 03: Our Flavours */}
        <FlavourSection onSelectFlavour={handleOpenOrderWithFlavour} />

        {/* CHAPTER 04: Bottle Craftsmanship */}
        <BottleCraft />

        {/* CHAPTER 05: Brand Philosophy */}
        <BrandPhilosophy />

        {/* CHAPTER 06: Interactive Nutrition */}
        <Benefits />

        {/* CHAPTER 07: Editorial Gallery (Horizontal Sticky Scroll) */}
        <Gallery />

        {/* CHAPTER 08: Final CTA */}
        <CTA
          onOpenOrder={() => setIsOrderOpen(true)}
          onWatchStory={() => setIsVideoOpen(true)}
        />
      </main>

      {/* Luxury Footer */}
      <Footer />

      {/* Interactive Modals */}
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        preselectedFlavour={selectedFlavour}
      />

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />
    </>
  );
}

