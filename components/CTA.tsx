'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Play, ArrowUpRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { FLAVOURS, Flavour } from '@/lib/constants';
import { luxuryAudio } from '@/lib/audio';

interface CTAProps {
  onOpenOrder: () => void;
  onWatchStory: () => void;
}

export function CTA({ onOpenOrder, onWatchStory }: CTAProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<Flavour>(FLAVOURS[0]);

  // Background smooth color transition on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  // Dark to Cream transition with high-contrast text color mapping
  const bgColor = useTransform(scrollYProgress, [0.2, 0.8], ['#050505', '#F5F1E8']);
  const textColor = useTransform(scrollYProgress, [0.2, 0.8], ['#F5F1E8', '#0F0E0C']);
  const subtextColor = useTransform(scrollYProgress, [0.2, 0.8], ['rgba(245,241,232,0.9)', 'rgba(15,14,12,0.9)']);
  const badgeBg = useTransform(scrollYProgress, [0.2, 0.8], ['rgba(200,169,106,0.15)', 'rgba(15,14,12,0.08)']);
  const badgeBorder = useTransform(scrollYProgress, [0.2, 0.8], ['rgba(200,169,106,0.5)', 'rgba(15,14,12,0.25)']);
  const badgeText = useTransform(scrollYProgress, [0.2, 0.8], ['#DFBF7B', '#7E6229']);
  const accentGoldText = useTransform(scrollYProgress, [0.2, 0.8], ['#E5C682', '#785617']);

  const handlePrimaryClick = () => {
    luxuryAudio.playClick();
    onOpenOrder();
  };

  return (
    <motion.section
      id="reserve"
      ref={containerRef}
      aria-label="Reserve ÉLAN Cold-Pressed Fruit Juice"
      style={{ backgroundColor: bgColor }}
      className="relative py-36 px-6 lg:px-12 overflow-hidden"
    >
      {/* Dynamic Color Aura behind selected bottle */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: `radial-gradient(circle, ${selectedBottle.color}50 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Floating Distinction Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ backgroundColor: badgeBg, borderColor: badgeBorder }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border backdrop-blur-md mb-8"
        >
          <motion.span
            style={{ color: badgeText }}
            className="text-[10px] font-sans tracking-[0.3em] uppercase font-bold"
          >
            LIMITED VINTAGE BATCH NO. 01 • BHOPAL HARVEST
          </motion.span>
        </motion.div>

        {/* Interactive Bottle Flavour Selector Tabs with Solid High Contrast */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {FLAVOURS.map((f) => {
            const isSelected = f.id === selectedBottle.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  luxuryAudio.playClick();
                  setSelectedBottle(f);
                }}
                onMouseEnter={() => luxuryAudio.playHover()}
                data-cursor="SELECT"
                className={`px-4 py-2.5 rounded-full text-xs font-serif tracking-widest transition-all duration-500 border flex items-center gap-2 font-medium shadow-md backdrop-blur-md ${
                  isSelected
                    ? 'bg-elan-dark text-elan-cream border-elan-gold shadow-[0_0_25px_rgba(200,169,106,0.4)] scale-105'
                    : 'bg-elan-dark/80 text-elan-cream/90 border-white/20 hover:border-elan-gold/60 hover:bg-elan-dark'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: f.color, color: f.color }}
                />
                {f.name}
              </button>
            );
          })}
        </div>

        {/* Floating Rotating Premium Bottle in Center */}
        <div className="relative w-64 h-96 sm:w-80 sm:h-[440px] my-4">
          <div
            className="absolute inset-0 rounded-full opacity-50 transition-opacity duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${selectedBottle.color}70 0%, transparent 70%)`,
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBottle.id}
              initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full will-change-transform"
            >
              <motion.div
                animate={{
                  y: [0, -14, 0],
                  rotate: [0, 2, 0, -2, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-full h-full will-change-transform"
              >
                <Image
                  src={selectedBottle.image}
                  alt={`ÉLAN ${selectedBottle.name} (${selectedBottle.volume}) cold-pressed raw fruit juice bottle`}
                  fill
                  sizes="(max-width: 640px) 256px, 320px"
                  className="object-contain"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selected Flavour Tagline with High Contrast */}
        <motion.span
          key={selectedBottle.tagline}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: badgeText }}
          className="text-xs font-sans tracking-[0.3em] uppercase font-bold mb-3"
        >
          {selectedBottle.tagline} • {selectedBottle.price}
        </motion.span>

        {/* Luxury Serif Heading */}
        <motion.h2
          style={{ color: textColor }}
          className="font-serif text-4xl sm:text-7xl md:text-8xl font-medium tracking-tight mb-6 leading-none"
        >
          Taste Nature.<br />
          <motion.span style={{ color: accentGoldText }} className="italic font-medium">
            Experience ÉLAN.
          </motion.span>
        </motion.h2>

        {/* Description Text */}
        <motion.p
          style={{ color: subtextColor }}
          className="font-sans text-sm sm:text-base max-w-xl font-medium tracking-wide mb-10 leading-relaxed"
        >
          Hand-pressed from Bhopal's finest organic groves, sealed in Italian crystal glass with sustainable oak. Delivered in refrigerated insulated casks directly to your doorstep.
        </motion.p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-14">
          {/* Primary Button */}
          <button
            onClick={handlePrimaryClick}
            data-cursor="RESERVE"
            className="group relative px-10 py-5 rounded-full bg-elan-dark text-elan-cream hover:bg-elan-gold hover:text-elan-dark font-serif text-xs tracking-[0.25em] uppercase font-semibold transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_rgba(200,169,106,0.5)] flex items-center gap-3 overflow-hidden border border-elan-gold/40"
          >
            <span>RESERVE {selectedBottle.name.toUpperCase()} ({selectedBottle.price})</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>

          {/* Secondary Button */}
          <motion.button
            onClick={() => {
              luxuryAudio.playClick();
              onWatchStory();
            }}
            data-cursor="WATCH"
            style={{ color: textColor, borderColor: textColor }}
            className="px-8 py-5 rounded-full border font-serif text-xs tracking-[0.25em] uppercase font-semibold hover:opacity-75 transition-opacity flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>WATCH FILM STORY</span>
          </motion.button>
        </div>

        {/* Charming Luxury Guarantees with Dynamic High Contrast */}
        <motion.div
          style={{ borderColor: badgeBorder }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t w-full max-w-3xl"
        >
          <motion.div className="flex items-center justify-center gap-2 text-xs font-sans font-semibold" style={{ color: subtextColor }}>
            <ShieldCheck className="w-4 h-4 text-elan-gold flex-shrink-0" />
            <span>100% Unfiltered Raw Cold Press</span>
          </motion.div>
          <motion.div className="flex items-center justify-center gap-2 text-xs font-sans font-semibold" style={{ color: subtextColor }}>
            <Truck className="w-4 h-4 text-elan-gold flex-shrink-0" />
            <span>Refrigerated Cask Express Delivery</span>
          </motion.div>
          <motion.div className="flex items-center justify-center gap-2 text-xs font-sans font-semibold" style={{ color: subtextColor }}>
            <RefreshCw className="w-4 h-4 text-elan-gold flex-shrink-0" />
            <span>100% Recyclable Glass & Oak Seal</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
