'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useImageSequence } from '@/hooks/useImageSequence';

const FRAME_COUNT = 240;

const OVERLAYS = [
  {
    start: 0,
    end: 0.22,
    title: 'AN ORCHARD IN EVERY DROP',
    subtitle: 'Harvested at absolute peak sweetness from hand-selected organic groves in Bhopal.',
  },
  {
    start: 0.25,
    end: 0.48,
    title: 'COLD PRESSED TO PERFECTION',
    subtitle: 'Zero heat pasteurization. 10,000 lbs of hydraulic pressure preserving live enzymes.',
  },
  {
    start: 0.51,
    end: 0.73,
    title: '100% UNFILTERED REAL FRUIT',
    subtitle: 'No added sugar. No preservatives. Pure vibrant nectar directly from bottle to palate.',
  },
  {
    start: 0.76,
    end: 0.98,
    title: 'PURE ELEVATED LUXURY',
    subtitle: 'Hand-crafted oak closure, crystal relief glass, and 24K gold foil stamp.',
  },
];

export function ScrollyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawnImgRef = useRef<HTMLImageElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Progressive high-performance image sequence loader
  const { getNearestLoadedFrame, isReady, progress, loadedCount, frameCount } = useImageSequence({
    folderPath: '/pr1_seq',
    frameCount: FRAME_COUNT,
  });

  // Scroll Progress across sticky section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll 0 -> 1 to frame index 0 -> 239
  const frameIndexTransform = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  // Observer to pause canvas rendering when off-screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Butter-smooth canvas render loop
  useEffect(() => {
    let animationFrameId: number;
    let lastWidth = 0;
    let lastHeight = 0;

    const render = () => {
      // If offscreen, skip rendering to save CPU/GPU cycles
      if (!isVisibleRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rawIndex = Math.floor(frameIndexTransform.get());
      const safeIndex = Math.min(frameCount - 1, Math.max(0, rawIndex));

      // Instant O(1) frame resolution with nearest-neighbor fallback
      const imgToDraw = getNearestLoadedFrame(safeIndex) || lastDrawnImgRef.current;

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      const targetCanvasWidth = Math.round(displayWidth * dpr);
      const targetCanvasHeight = Math.round(displayHeight * dpr);

      const sizeChanged = canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight;

      if (sizeChanged) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
        lastWidth = targetCanvasWidth;
        lastHeight = targetCanvasHeight;
      }

      // Only draw if frame or canvas size changed
      if (imgToDraw && (imgToDraw !== lastDrawnImgRef.current || sizeChanged)) {
        lastDrawnImgRef.current = imgToDraw;

        ctx.save();
        ctx.scale(dpr, dpr);

        const imgRatio = imgToDraw.naturalWidth / imgToDraw.naturalHeight;
        const canvasRatio = displayWidth / displayHeight;

        let drawWidth = displayWidth;
        let drawHeight = displayHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
          drawWidth = displayWidth;
          drawHeight = displayWidth / imgRatio;
          offsetY = (displayHeight - drawHeight) / 2;
        } else {
          drawHeight = displayHeight;
          drawWidth = displayHeight * imgRatio;
          offsetX = (displayWidth - drawWidth) / 2;
        }

        ctx.drawImage(imgToDraw, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [getNearestLoadedFrame, frameIndexTransform, frameCount]);

  return (
    <div id="film" ref={containerRef} className="relative w-full h-[450vh] bg-elan-dark">
      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Hardware-accelerated HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block will-change-transform"
          style={{ width: '100vw', height: '100vh', transform: 'translateZ(0)' }}
        />

        {/* Rapid Luxury Loader Overlay - Fades instantly once keyframes are active */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 bg-elan-dark z-30 flex flex-col items-center justify-center gap-6 px-6"
            >
              <div className="w-12 h-12 rounded-full border border-elan-gold/30 flex items-center justify-center animate-spin">
                <div className="w-2 h-2 rounded-full bg-elan-gold" />
              </div>
              <div className="flex flex-col items-center gap-2 max-w-xs w-full">
                <span className="font-serif tracking-[0.25em] text-xs text-elan-gold uppercase">
                  PREPARING CINEMATIC FILM ({Math.round(progress * 100)}%)
                </span>
                <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-elan-gold"
                    style={{ width: `${Math.max(10, progress * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft Filmic Contrast Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0.35)_0%,rgba(5,5,5,0.75)_100%)] z-10" />

        {/* Synchronized Classy Typography Overlays */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-6">
          {OVERLAYS.map((ch, idx) => (
            <ClassyFilmTextOverlay
              key={idx}
              progress={scrollYProgress}
              start={ch.start}
              end={ch.end}
              title={ch.title}
              subtitle={ch.subtitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassyFilmTextOverlay({
  progress,
  start,
  end,
  title,
  subtitle,
}: {
  progress: any;
  start: number;
  end: number;
  title: string;
  subtitle: string;
}) {
  const opacity = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [25, 0, 0, -25]
  );

  return (
    <motion.div
      style={{ opacity, y, transform: 'translateZ(0)' }}
      className="absolute max-w-4xl text-center flex flex-col items-center px-6 will-change-transform"
    >
      {/* Classy Main Title with Hardware-Accelerated Text Shadow */}
      <h2
        className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-wide text-elan-cream mb-4 leading-[1.1]"
        style={{ textShadow: '0 4px 24px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.8)' }}
      >
        {title}
      </h2>

      {/* Classy Subtitle with Hardware-Accelerated Text Shadow */}
      <p
        className="font-sans text-sm sm:text-lg text-elan-cream/90 max-w-xl font-light tracking-wide leading-relaxed"
        style={{ textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.8)' }}
      >
        {subtitle}
      </p>
    </motion.div>
  );
}
