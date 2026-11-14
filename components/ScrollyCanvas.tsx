'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, MotionValue } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useImageSequence, DrawableFrame } from '@/hooks/useImageSequence';
import { smoothScrollTo } from '@/lib/lenis';

const FRAME_COUNT = 240;

const OVERLAYS = [
  {
    start: 0.16,
    end: 0.34,
    chapter: '02 / HARVEST',
    title: 'AN ORCHARD IN EVERY DROP',
    subtitle: 'Harvested at absolute peak sweetness from hand-selected organic groves in Bhopal.',
  },
  {
    start: 0.36,
    end: 0.54,
    chapter: '03 / EXTRACTION',
    title: 'COLD PRESSED TO PERFECTION',
    subtitle: 'Zero heat pasteurization. 10,000 lbs of hydraulic pressure preserving live enzymes.',
  },
  {
    start: 0.56,
    end: 0.72,
    chapter: '04 / PURITY',
    title: '100% UNFILTERED REAL FRUIT',
    subtitle: 'No added sugar. No preservatives. Pure vibrant nectar directly from bottle to palate.',
  },
  {
    start: 0.74,
    end: 0.89,
    chapter: '05 / CRAFT',
    title: 'PURE ELEVATED LUXURY',
    subtitle: 'Hand-crafted oak closure, crystal relief glass, and 24K gold foil stamp.',
  },
];

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulse: number;
}

export function ScrollyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const lastDrawnImgRef = useRef<DrawableFrame | null>(null);
  const lastPortraitEndCardRef = useRef<boolean>(false);
  const sizeDirtyRef = useRef<boolean>(true);
  const isVisibleRef = useRef<boolean>(true);
  const [isSectionActive, setIsSectionActive] = useState(true);
  const smoothedFrameRef = useRef<number>(0);

  // Cached viewport dimensions
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 1920,
    height: 1080,
    dpr: 1,
  });

  const particlesRef = useRef<Particle[]>([]);

  // High performance sequence loader for /pr_seq & /pr_seq_mobile
  const { getNearestLoadedFrame, isReady, progress, frameCount } = useImageSequence({
    frameCount: FRAME_COUNT,
    isActive: isSectionActive,
  });

  // Scroll Progress across sticky section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Transform scroll 0..1 directly to frame index
  const frameIndexTransform = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  // Observer to pause canvas rendering and deprioritize background frames when off-screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          setIsSectionActive(entry.isIntersecting);
        });
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Viewport resize tracking & particles initialization
  useEffect(() => {
    const syncDimensions = () => {
      if (typeof window === 'undefined') return;
      const box = stickyRef.current;
      const w = box?.clientWidth || window.innerWidth;
      const h = box?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      if (sizeRef.current.width !== w || sizeRef.current.height !== h || sizeRef.current.dpr !== dpr) {
        sizeRef.current = { width: w, height: h, dpr };
        sizeDirtyRef.current = true;
      }

      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);

      const filmCanvas = canvasRef.current;
      if (filmCanvas && (filmCanvas.width !== targetW || filmCanvas.height !== targetH)) {
        filmCanvas.width = targetW;
        filmCanvas.height = targetH;
        sizeDirtyRef.current = true;
      }

      const pCanvas = particleCanvasRef.current;
      if (pCanvas && (pCanvas.width !== targetW || pCanvas.height !== targetH)) {
        pCanvas.width = targetW;
        pCanvas.height = targetH;
      }

      const isMobile = w < 768;
      const targetCount = isMobile ? 18 : 32;
      if (particlesRef.current.length !== targetCount) {
        particlesRef.current = Array.from({ length: targetCount }).map(() => ({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 18,
          speedY: -(Math.random() * 24 + 6),
          opacity: Math.random() * 0.6 + 0.2,
          pulse: Math.random() * 1.2 + 0.4,
        }));
      }
    };

    syncDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stickyRef.current) {
      resizeObserver = new ResizeObserver(syncDimensions);
      resizeObserver.observe(stickyRef.current);
    }

    window.addEventListener('resize', syncDimensions, { passive: true });
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncDimensions);
    };
  }, []);

  // Unified high-FPS render loop: film canvas only blits on frame/size change; particles animate at steady dt
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!isVisibleRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const filmCanvas = canvasRef.current;
      const pCanvas = particleCanvasRef.current;
      const filmCtx = filmCanvas?.getContext('2d', { alpha: false });

      if (filmCanvas && filmCtx) {
        const { width, height, dpr } = sizeRef.current;
        const targetCanvasW = Math.round(width * dpr);
        const targetCanvasH = Math.round(height * dpr);

        if (filmCanvas.width !== targetCanvasW || filmCanvas.height !== targetCanvasH) {
          filmCanvas.width = targetCanvasW;
          filmCanvas.height = targetCanvasH;
          sizeDirtyRef.current = true;
        }

        const rawTarget = frameIndexTransform.get();
        const delta = rawTarget - smoothedFrameRef.current;

        if (reduceMotion || Math.abs(delta) > 45 || Math.abs(delta) < 0.06) {
          smoothedFrameRef.current = rawTarget;
        } else {
          // Frame-rate independent snappy interpolation (~40ms settle) eliminates discrete wheel/touch steps
          const factor = 1 - Math.exp(-32 * dt);
          smoothedFrameRef.current += delta * factor;
        }

        const safeIndex = Math.min(
          frameCount - 1,
          Math.max(0, Math.round(smoothedFrameRef.current))
        );
        // Keep loader informed of the leading raw target when scrubbing fast
        const rawIndex = Math.min(frameCount - 1, Math.max(0, Math.round(rawTarget)));
        if (rawIndex !== safeIndex) {
          getNearestLoadedFrame(rawIndex);
        }
        const imgToDraw = getNearestLoadedFrame(safeIndex) || lastDrawnImgRef.current;

        const isPortraitEndCard = width < height * 0.8 && safeIndex >= 231;

        // Redraw when frame image, viewport dimensions, or portrait crest framing changes
        if (
          imgToDraw &&
          (imgToDraw !== lastDrawnImgRef.current ||
            isPortraitEndCard !== lastPortraitEndCardRef.current ||
            sizeDirtyRef.current)
        ) {
          lastDrawnImgRef.current = imgToDraw;
          lastPortraitEndCardRef.current = isPortraitEndCard;
          sizeDirtyRef.current = false;

          const naturalW = 'naturalWidth' in imgToDraw ? imgToDraw.naturalWidth : imgToDraw.width;
          const naturalH = 'naturalHeight' in imgToDraw ? imgToDraw.naturalHeight : imgToDraw.height;
          if (naturalW > 0 && naturalH > 0) {
            const imgRatio = naturalW / naturalH;
            const canvasRatio = width / height;

            let drawW = width;
            let drawH = height;
            let offsetX = 0;
            let offsetY = 0;

            if (isPortraitEndCard) {
              // Keep full crest & tagline inside portrait width while softly zooming into the dark reveal
              drawW = width * 1.12;
              drawH = drawW / imgRatio;
              offsetX = (width - drawW) / 2;
              offsetY = (height - drawH) / 2;
            } else if (canvasRatio > imgRatio) {
              drawW = width;
              drawH = width / imgRatio;
              offsetY = (height - drawH) / 2;
            } else {
              drawH = height;
              drawW = height * imgRatio;
              offsetX = (width - drawW) / 2;
            }

            filmCtx.save();
            filmCtx.scale(dpr, dpr);
            filmCtx.fillStyle = '#050505';
            filmCtx.fillRect(0, 0, width, height);
            filmCtx.imageSmoothingEnabled = true;
            filmCtx.imageSmoothingQuality = 'high';
            filmCtx.drawImage(imgToDraw, offsetX, offsetY, drawW, drawH);

            if (isPortraitEndCard) {
              const featherH = Math.max(20, drawH * 0.14);
              const topGrad = filmCtx.createLinearGradient(0, offsetY, 0, offsetY + featherH);
              topGrad.addColorStop(0, '#050505');
              topGrad.addColorStop(1, 'rgba(5, 5, 5, 0)');
              filmCtx.fillStyle = topGrad;
              filmCtx.fillRect(0, Math.max(0, offsetY - 2), width, featherH + 2);

              const bottomY = offsetY + drawH;
              const botGrad = filmCtx.createLinearGradient(0, bottomY - featherH, 0, bottomY);
              botGrad.addColorStop(0, 'rgba(5, 5, 5, 0)');
              botGrad.addColorStop(1, '#050505');
              filmCtx.fillStyle = botGrad;
              filmCtx.fillRect(0, bottomY - featherH, width, featherH + 2);
            }

            filmCtx.restore();
          }
        } else if (!imgToDraw && sizeDirtyRef.current) {
          sizeDirtyRef.current = false;
          filmCtx.save();
          filmCtx.scale(dpr, dpr);
          filmCtx.fillStyle = '#060606';
          filmCtx.fillRect(0, 0, width, height);
          filmCtx.restore();
        }
      }

      // Lightweight transparent particle overlay
      if (pCanvas && !reduceMotion) {
        const pCtx = pCanvas.getContext('2d');
        if (pCtx) {
          const { width, height, dpr } = sizeRef.current;
          const targetCanvasW = Math.round(width * dpr);
          const targetCanvasH = Math.round(height * dpr);
          if (pCanvas.width !== targetCanvasW || pCanvas.height !== targetCanvasH) {
            pCanvas.width = targetCanvasW;
            pCanvas.height = targetCanvasH;
          }

          pCtx.save();
          pCtx.scale(dpr, dpr);
          pCtx.clearRect(0, 0, width, height);

          const particles = particlesRef.current;
          const tSec = now * 0.001;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y += p.speedY * dt;
            p.x += p.speedX * dt;

            if (p.y < -4) {
              p.y = height + 4;
              p.x = Math.random() * width;
            }
            if (p.x < -4) p.x = width + 4;
            if (p.x > width + 4) p.x = -4;

            const alpha = Math.max(
              0.12,
              Math.min(0.75, p.opacity + Math.sin(tSec * p.pulse) * 0.18)
            );

            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(200, 169, 106, ${alpha})`;
            pCtx.fill();
          }
          pCtx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [getNearestLoadedFrame, frameIndexTransform, frameCount]);

  const handleScrollDown = () => {
    if (containerRef.current) {
      const top = containerRef.current.offsetTop;
      const height = containerRef.current.offsetHeight;
      smoothScrollTo(top + height * 0.22, 1.05);
    }
  };

  return (
    <section
      id="film"
      ref={containerRef}
      aria-label="ÉLAN Pure Fruit Joy Cold-Pressed Juice Story"
      className="relative w-full h-[360vh] bg-elan-dark z-20"
    >
      {/* Sticky Fullscreen Container */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-elan-dark"
      >
        {/* Hardware-accelerated Film Canvas (redraws only on frame change) */}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Cinematic scrollytelling showcase of ÉLAN cold-pressed raw fruit juice crafted from ripe Alphonso mango, pink guava, strawberry, and forest berries"
          className="w-full h-full object-cover block will-change-transform"
          style={{ width: '100%', height: '100%', transform: 'translateZ(0)' }}
        />

        {/* Lightweight Transparent Gold Particle Overlay */}
        <canvas
          ref={particleCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
        />

        {/* Lightweight First-time Loader: Fades out smoothly as soon as frame 0 paints */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 bg-elan-dark z-40 flex flex-col items-center justify-center gap-6 px-6"
            >
              <div className="w-10 h-10 rounded-full border border-elan-gold/30 flex items-center justify-center animate-spin">
                <div className="w-2 h-2 rounded-full bg-elan-gold" />
              </div>
              <div className="flex flex-col items-center gap-2 max-w-xs w-full">
                <span className="font-serif tracking-[0.25em] text-[11px] text-elan-gold uppercase">
                  INITIALIZING EXPERIENCE ({Math.round(progress * 100)}%)
                </span>
                <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-elan-gold"
                    style={{ width: `${Math.max(15, progress * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft Filmic Contrast Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0.20)_0%,rgba(5,5,5,0.85)_100%)] z-[15]" />

        {/* Chapter Indicator Timeline (Right Side on Desktop) */}
        <ChapterIndicator progress={scrollYProgress} />

        {/* INTRODUCTION OVERLAY (Hero Phase: 0% to 15% scroll) */}
        <IntroductionHeroOverlay progress={scrollYProgress} onScrollDown={handleScrollDown} />

        {/* STORYTELLING CHAPTERS (16% to 100% scroll) */}
        <div className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none px-6">
          {OVERLAYS.map((ch, idx) => (
            <ClassyFilmTextOverlay
              key={idx}
              progress={scrollYProgress}
              start={ch.start}
              end={ch.end}
              chapter={ch.chapter}
              title={ch.title}
              subtitle={ch.subtitle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Introduction Hero Overlay:
 * Appears at scroll position 0 and smoothly glides away as the user scrolls into the bottle reveal.
 */
function IntroductionHeroOverlay({
  progress,
  onScrollDown,
}: {
  progress: MotionValue<number>;
  onScrollDown: () => void;
}) {
  const opacity = useTransform(progress, [0, 0.05, 0.13], [1, 1, 0]);
  const y = useTransform(progress, [0, 0.13], [0, -35]);
  const scale = useTransform(progress, [0, 0.13], [1, 0.96]);
  const pointerEvents = useTransform(progress, (v: number) => (v < 0.1 ? 'auto' : 'none'));

  return (
    <motion.div
      style={{
        opacity,
        y,
        scale,
        pointerEvents,
        transform: 'translateZ(0)',
      }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center select-none will-change-transform"
    >
      {/* Gold Leaf Logo Insignia */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 sm:mb-8"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-elan-gold/40 flex items-center justify-center bg-gradient-to-b from-elan-gold/20 via-elan-gold/5 to-transparent backdrop-blur-md shadow-[0_0_35px_rgba(200,169,106,0.3)]">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 text-elan-gold">
            <path
              d="M16 3C11 8 8 13.5 8 18.5C8 22.6421 11.3579 26 15.5 26C19.6421 26 23 22.6421 23 18.5C23 13.5 20 8 16 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 8V18.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Brand Title */}
      <motion.h1
        initial={{ y: 18 }}
        animate={{ y: 0 }}
        transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-6xl sm:text-8xl md:text-9xl tracking-[0.2em] font-medium text-gold-gradient mb-3 drop-shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
      >
        ÉLAN
        <span className="sr-only"> — Pure Fruit Joy Cold-Pressed Raw Fruit Juice, Bhopal</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-xs sm:text-sm md:text-base font-sans tracking-[0.45em] uppercase text-elan-gold font-light mb-6 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
      >
        PURE FRUIT JOY
      </motion.p>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.45 }}
        className="font-serif italic text-base sm:text-2xl text-elan-cream/85 tracking-wider font-light max-w-xl mx-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
      >
        Crafted by Nature. Perfected for You.
      </motion.p>

      {/* Scroll Invitation Indicator */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 0.8, delay: 0.7 },
          y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        }}
        onClick={onScrollDown}
        aria-label="Scroll down to explore ÉLAN cold-pressed fruit juice film"
        data-cursor="SCROLL"
        className="absolute bottom-10 z-30 flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-0"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-elan-gold/70 font-sans group-hover:text-elan-gold transition-colors">
          SCROLL TO EXPLORE
        </span>
        <div className="w-8 h-8 rounded-full border border-elan-gold/30 flex items-center justify-center group-hover:border-elan-gold group-hover:bg-elan-gold/15 transition-all shadow-[0_0_15px_rgba(200,169,106,0.2)]">
          <ChevronDown className="w-4 h-4 text-elan-gold" aria-hidden="true" />
        </div>
      </motion.button>
    </motion.div>
  );
}

/**
 * Synchronized Chapter Overlays
 */
function ClassyFilmTextOverlay({
  progress,
  start,
  end,
  chapter,
  title,
  subtitle,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  chapter: string;
  title: string;
  subtitle: string;
}) {
  const opacity = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [24, 0, 0, -24]
  );

  const scale = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [0.98, 1, 1, 0.98]
  );

  return (
    <motion.div
      style={{ opacity, y, scale, transform: 'translateZ(0)' }}
      className="absolute max-w-4xl text-center flex flex-col items-center px-6 will-change-transform"
    >
      {/* Chapter Badge */}
      <span
        className="font-sans text-[10px] sm:text-xs tracking-[0.35em] uppercase text-elan-gold font-light mb-3 px-3 py-1 rounded-full border border-elan-gold/30 bg-elan-gold/5 backdrop-blur-md"
        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
      >
        {chapter}
      </span>

      {/* Main Title */}
      <h2
        className="font-serif text-3xl sm:text-5xl md:text-7xl font-medium tracking-wide text-elan-cream mb-4 leading-[1.15]"
        style={{ textShadow: '0 4px 28px rgba(0,0,0,0.98), 0 2px 10px rgba(0,0,0,0.9)' }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      <p
        className="font-sans text-sm sm:text-lg md:text-xl text-elan-cream/90 max-w-xl font-light tracking-wide leading-relaxed"
        style={{ textShadow: '0 2px 18px rgba(0,0,0,0.98), 0 1px 6px rgba(0,0,0,0.9)' }}
      >
        {subtitle}
      </p>
    </motion.div>
  );
}

/**
 * Subtle Vertical Progress Indicator on Desktop
 */
function ChapterIndicator({ progress }: { progress: MotionValue<number> }) {
  const chapters = [
    { label: '01', range: [0, 0.155] },
    { label: '02', range: [0.155, 0.35] },
    { label: '03', range: [0.35, 0.55] },
    { label: '04', range: [0.55, 0.73] },
    { label: '05', range: [0.73, 1.01] },
  ];

  return (
    <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-4 pointer-events-none">
      {chapters.map((ch, i) => (
        <ChapterDot key={i} progress={progress} min={ch.range[0]} max={ch.range[1]} label={ch.label} />
      ))}
    </div>
  );
}

function ChapterDot({
  progress,
  min,
  max,
  label,
}: {
  progress: MotionValue<number>;
  min: number;
  max: number;
  label: string;
}) {
  const opacity = useTransform(progress, (v: number) => (v >= min && v < max ? 1 : 0.35));
  const scale = useTransform(progress, (v: number) => (v >= min && v < max ? 1.25 : 1));

  return (
    <motion.div
      style={{ opacity, scale }}
      className="flex items-center gap-2 transition-opacity duration-200"
    >
      <span className="text-[9px] font-sans tracking-widest text-elan-gold">
        {label}
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-elan-gold shadow-[0_0_8px_rgba(200,169,106,0.6)]" />
    </motion.div>
  );
}
