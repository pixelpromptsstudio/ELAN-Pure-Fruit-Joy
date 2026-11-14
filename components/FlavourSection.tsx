'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FLAVOURS, Flavour } from '@/lib/constants';
import { ArrowRight, X, Droplets, MapPin, Award, SlidersHorizontal, Plus } from 'lucide-react';
import { luxuryAudio } from '@/lib/audio';
import { setLenisPaused } from '@/lib/lenis';

export function FlavourSection({ onSelectFlavour }: { onSelectFlavour: (flavour: Flavour) => void }) {
  const [selectedFlavour, setSelectedFlavour] = useState<Flavour | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setLenisPaused(!!selectedFlavour);
    if (!selectedFlavour) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedFlavour(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      setLenisPaused(false);
    };
  }, [selectedFlavour]);

  return (
    <section id="flavours" className="relative py-28 px-6 lg:px-12 bg-elan-dark overflow-hidden">
      {/* Background Decorative Ambient Glows - GPU hardware-accelerated radial gradients without heavy blur filters */}
      <div
        className="absolute top-1/4 -left-40 w-96 h-96 pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(200, 169, 106, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-1/4 -right-40 w-96 h-96 pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(94, 28, 68, 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-wide text-elan-cream mb-6"
          >
            Nectar of Pure Distinction
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-sm sm:text-base text-elan-cream/70 max-w-2xl font-light tracking-wide leading-relaxed mb-8"
          >
            Four signature cold-pressed formulations crafted from single-origin organic orchards. Each bottle captures the unaltered raw soul of pure fruit.
          </motion.p>

          {/* Toggle Comparison View */}
          <button
            onClick={() => {
              luxuryAudio.playClick();
              setShowComparison(!showComparison);
            }}
            data-cursor="COMPARE"
            className="px-6 py-2.5 rounded-full border border-elan-gold/40 bg-elan-gold/10 text-elan-gold text-xs font-serif tracking-[0.2em] uppercase hover:bg-elan-gold hover:text-elan-dark transition-all duration-300 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showComparison ? 'HIDE SPEC MATRIX' : 'COMPARE FLAVOUR MATRIX'}
          </button>
        </div>

        {/* Comparison Matrix Table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-20 rounded-3xl bg-white/[0.02] border border-elan-gold/30 p-6 sm:p-8 backdrop-blur-xl overflow-x-auto"
            >
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 text-xs font-serif tracking-[0.2em] uppercase text-elan-gold">SPECIFICATION</th>
                    {FLAVOURS.map((f) => (
                      <th key={f.id} className="py-4 text-center">
                        <span className="font-serif text-lg text-elan-cream block">{f.name}</span>
                        <span className="text-[10px] font-sans text-elan-gold uppercase">{f.price}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-sans font-light">
                  <tr>
                    <td className="py-4 text-elan-cream/80 font-serif text-sm">Natural Density</td>
                    {FLAVOURS.map((f) => (
                      <td key={f.id} className="py-4 text-center text-elan-cream">{f.brix}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-elan-cream/80 font-serif text-sm">Harvest Origin</td>
                    {FLAVOURS.map((f) => (
                      <td key={f.id} className="py-4 text-center text-elan-gold">{f.origin}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-elan-cream/80 font-serif text-sm">Primary Bio-Actives</td>
                    {FLAVOURS.map((f) => (
                      <td key={f.id} className="py-4 text-center text-elan-cream/70">{f.vitamins.join(' • ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-elan-cream/80 font-serif text-sm">Hydraulic Heat Factor</td>
                    {FLAVOURS.map((f) => (
                      <td key={f.id} className="py-4 text-center text-emerald-400 font-medium">0°C Raw Press</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flavours Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FLAVOURS.map((flavour) => (
            <FlavourCard
              key={flavour.id}
              flavour={flavour}
              onOpenDetail={() => setSelectedFlavour(flavour)}
              onQuickAdd={() => onSelectFlavour(flavour)}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFlavour && (
          <FlavourDetailModal
            flavour={selectedFlavour}
            onClose={() => setSelectedFlavour(null)}
            onOrder={() => {
              const f = selectedFlavour;
              setSelectedFlavour(null);
              onSelectFlavour(f);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function FlavourCard({
  flavour,
  onOpenDetail,
  onQuickAdd,
}: {
  flavour: Flavour;
  onOpenDetail: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <article
      data-cursor="DISCOVER"
      onClick={onOpenDetail}
      className="group relative rounded-3xl p-6 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-elan-gold/40 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl will-change-transform"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 480px',
      }}
    >
      {/* Background Radial Glow Color tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${flavour.bgGlow} 0%, transparent 75%)`,
        }}
      />

      {/* Card Content Top */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-elan-gold/80 block mb-1">
            {flavour.volume} • {flavour.price}
          </span>
          <h3 className="font-serif text-2xl text-elan-cream font-medium group-hover:text-elan-gold transition-colors duration-300">
            {flavour.name}
          </h3>
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: flavour.color }}
        />
      </div>

      {/* Bottle Image Showcase Container */}
      <div className="relative w-full h-80 my-2 flex items-center justify-center">
        {/* Soft Radial Ambient Glow */}
        <div
          className="absolute w-44 h-44 rounded-full opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${flavour.color}50 0%, transparent 70%)`,
          }}
        />

        {/* Clean CSS Hardware-accelerated hover transition without costly software drop-shadows */}
        <div className="relative w-full h-full transform group-hover:scale-105 group-hover:-translate-y-1 transition-transform duration-300 ease-out will-change-transform">
          <Image
            src={flavour.image}
            alt={`ÉLAN ${flavour.name} — ${flavour.volume} cold-pressed ${flavour.tagline.toLowerCase()} juice bottle`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        </div>
      </div>

      {/* Card Footer & Description */}
      <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
        <p className="font-sans text-xs text-elan-cream/70 font-light mb-4 line-clamp-2 leading-relaxed">
          {flavour.description}
        </p>

        {/* Tasting Notes Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {flavour.tastingNotes.map((note, i) => (
            <span
              key={i}
              className="text-[9px] font-sans tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/5 text-elan-cream/80 border border-white/10 group-hover:border-elan-gold/30"
            >
              {note}
            </span>
          ))}
        </div>

        {/* CTA Link */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-serif tracking-[0.2em] uppercase text-elan-gold group-hover:translate-x-1 transition-transform flex items-center gap-1">
            VIEW DETAILS <ArrowRight className="w-3 h-3 ml-1" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              luxuryAudio.playClick();
              onQuickAdd();
            }}
            data-cursor="ORDER"
            className="p-2 rounded-full border border-elan-gold/30 text-elan-gold hover:bg-elan-gold hover:text-elan-dark transition-all duration-200"
            aria-label={`Order ÉLAN ${flavour.name} (${flavour.price})`}
            title="Order this flavour"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function FlavourDetailModal({
  flavour,
  onClose,
  onOrder,
}: {
  flavour: Flavour;
  onClose: () => void;
  onOrder: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25 }}
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-elan-dark border border-elan-gold/30 rounded-3xl overflow-hidden p-6 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close flavour details"
          className="absolute top-6 right-6 p-2.5 rounded-full border border-white/15 text-elan-cream hover:text-elan-gold hover:border-elan-gold transition-colors z-20"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left Column: Image */}
          <div className="relative h-80 sm:h-[400px] w-full flex items-center justify-center rounded-2xl bg-white/[0.02] p-6 border border-white/5">
            <div
              className="absolute w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${flavour.color}45 0%, transparent 70%)`,
              }}
            />
            <Image
              src={flavour.image}
              alt={`ÉLAN ${flavour.name} — ${flavour.volume} cold-pressed ${flavour.tagline.toLowerCase()} bottle`}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-contain p-4"
            />
          </div>

          {/* Right Column: Information */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4 md:pr-14 mb-2">
              <span className="text-xs font-sans tracking-[0.4em] uppercase text-elan-gold">
                {flavour.tagline}
              </span>
              <span className="font-serif text-2xl text-gold-gradient font-medium shrink-0">{flavour.price}</span>
            </div>

            <span className="text-[10px] font-sans tracking-[0.35em] uppercase text-elan-gold/80 mb-2 block">
              {flavour.harvestWindow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-elan-cream mb-3">
              {flavour.name}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-elan-cream/80 font-light leading-relaxed mb-5">
              {flavour.description}
            </p>

            {/* Sommelier Palate Balance */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-5 space-y-2.5">
              {(
                [
                  ['Sweetness', flavour.palate.sweetness],
                  ['Acidity', flavour.palate.acidity],
                  ['Velvet Body', flavour.palate.body],
                ] as const
              ).map(([label, score]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-elan-cream/70">
                    {label}
                  </span>
                  <div className="flex items-center gap-1.5" aria-label={`${label}: ${score} out of 5`}>
                    {[1, 2, 3, 4, 5].map((pip) => (
                      <span
                        key={pip}
                        className="w-5 h-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: pip <= score ? flavour.color : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] font-serif italic text-elan-gold/90 pt-1 border-t border-white/5">
                Pairing: {flavour.pairing}
              </p>
            </div>

            {/* Spec Badges */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Droplets className="w-4 h-4 text-elan-gold" />
                <div>
                  <span className="text-[9px] text-elan-cream/60 uppercase block">Sugar Density</span>
                  <span className="font-serif text-sm text-elan-cream">{flavour.brix}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-elan-gold" />
                <div>
                  <span className="text-[9px] text-elan-cream/60 uppercase block">Harvest Origin</span>
                  <span className="font-serif text-sm text-elan-cream">{flavour.origin}</span>
                </div>
              </div>
            </div>

            {/* Vitamins List */}
            <div className="mb-6">
              <span className="text-xs font-serif tracking-[0.2em] uppercase text-elan-gold/90 block mb-2.5">
                Key Nutrients & Bio-Actives
              </span>
              <div className="flex flex-wrap gap-2">
                {flavour.vitamins.map((vit, i) => (
                  <span
                    key={i}
                    className="text-xs font-sans px-3 py-1 rounded-full bg-elan-gold/10 text-elan-cream border border-elan-gold/30 flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-elan-gold" /> {vit}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                luxuryAudio.playClick();
                onOrder();
              }}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-elan-gold via-elan-goldLight to-elan-gold text-elan-dark font-serif tracking-[0.25em] text-xs uppercase font-semibold hover:opacity-95 transition-all duration-200"
            >
              RESERVE {flavour.name.toUpperCase()} ({flavour.price})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
