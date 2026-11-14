'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { BOTTLE_CRAFT_FEATURES, CraftFeature } from '@/lib/constants';
import { Check } from 'lucide-react';
import { getAssetPath } from '@/lib/utils';
import { luxuryAudio } from '@/lib/audio';

export function BottleCraft() {
  const [activeFeature, setActiveFeature] = useState<CraftFeature>(BOTTLE_CRAFT_FEATURES[0]);

  return (
    <section id="craft" className="relative py-32 px-6 lg:px-12 bg-elan-dark overflow-hidden border-t border-white/5">
      {/* Ambient Lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(200, 169, 106, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="flex flex-col items-center text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-wide text-elan-cream mb-6"
          >
            Architectural Luxury Glass
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-sm sm:text-base text-elan-cream/70 max-w-2xl font-light tracking-wide leading-relaxed"
          >
            Every line, relief engraving, and closure was designed in Milan to protect fragile cold-pressed bio-actives while creating an extraordinary sensory touchpoint.
          </motion.p>
        </div>

        {/* Main Interactive Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Feature Selection Tabs (Left Column) */}
          <div className="lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1">
            {BOTTLE_CRAFT_FEATURES.map((feature, idx) => {
              const isSelected = activeFeature.id === feature.id;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    luxuryAudio.playClick();
                    setActiveFeature(feature);
                  }}
                  onMouseEnter={() => luxuryAudio.playHover()}
                  data-cursor="INSPECT"
                  className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-elan-gold/10 border-elan-gold shadow-[0_0_30px_rgba(200,169,106,0.15)] scale-[1.02]'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl text-elan-cream font-medium">
                      {feature.title}
                    </h3>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-elan-gold animate-ping" />
                    )}
                  </div>
                  <p className="font-sans text-xs text-elan-cream/60 font-light">
                    {feature.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Large Bottle Graphic Display (Right Column) */}
          <div className="lg:col-span-8 flex flex-col gap-4 order-1 lg:order-2">
            <div className="relative h-[440px] sm:h-[540px] lg:h-[600px] w-full rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 overflow-hidden flex items-center justify-center lg:justify-start p-4 sm:p-8 lg:pl-8 xl:pl-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,106,0.15)_0%,transparent_70%)] pointer-events-none" />

              {/* Aspect-locked stage keeps hotspots glued to exact bottle features on all screens */}
              <div className="relative h-full max-w-full aspect-[1024/1096]">
                <Image
                  src={getAssetPath('/pr2/packaging-poster.webp')}
                  alt="ÉLAN architectural Italian crystal glass bottle with solid oak cap, 24K gold insignia, and botanical relief"
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-contain"
                />

                {/* Hotspot Markers */}
                {BOTTLE_CRAFT_FEATURES.map((feature) => {
                  const isSelected = activeFeature.id === feature.id;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        luxuryAudio.playClick();
                        setActiveFeature(feature);
                      }}
                      onMouseEnter={() => luxuryAudio.playHover()}
                      aria-label={`Inspect ${feature.title}: ${feature.subtitle}`}
                      aria-pressed={isSelected}
                      data-cursor="HOTSPOT"
                      style={{
                        left: `${feature.xPercent}%`,
                        top: `${feature.yPercent}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    >
                      <div
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                          isSelected ? 'scale-125' : 'hover:scale-110'
                        }`}
                      >
                        <div
                          className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                            isSelected ? 'bg-elan-gold' : 'bg-white/40'
                          }`}
                        />
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center shadow-lg transition-colors ${
                            isSelected
                              ? 'bg-elan-gold border-elan-cream text-elan-dark'
                              : 'bg-black/60 border-elan-gold/60 text-elan-gold hover:bg-elan-gold hover:text-elan-dark'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Annotation Card */}
              <div className="hidden lg:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="lg:absolute lg:bottom-6 lg:right-6 lg:max-w-[270px] p-5 rounded-2xl bg-elan-dark/90 border border-elan-gold/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-elan-gold" aria-hidden="true" />
                      <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-elan-gold">
                        {activeFeature.highlightText}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-elan-cream mb-2">
                      {activeFeature.title}
                    </h3>
                    <p className="font-sans text-xs text-elan-cream/80 font-light leading-relaxed">
                      {activeFeature.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile/Tablet Non-Overlapping Annotation Card */}
            <div className="lg:hidden p-5 rounded-2xl bg-elan-dark/90 border border-elan-gold/40 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Check className="w-4 h-4 text-elan-gold" aria-hidden="true" />
                <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-elan-gold">
                  {activeFeature.highlightText}
                </span>
              </div>
              <h3 className="font-serif text-xl text-elan-cream mb-1.5">
                {activeFeature.title}
              </h3>
              <p className="font-sans text-xs text-elan-cream/80 font-light leading-relaxed">
                {activeFeature.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
