'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { useImageSequence } from '@/hooks/useImageSequence';
import { luxuryAudio } from '@/lib/audio';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_FRAMES = 240;
const FPS = 24;

function getCaptionForFrame(frame: number): { chapter: string; line: string } {
  const pct = frame / (TOTAL_FRAMES - 1);
  if (pct < 0.16) {
    return {
      chapter: '01 / ARRIVAL',
      line: 'Crafted by nature from sun-ripened whole orchards.',
    };
  }
  if (pct < 0.36) {
    return {
      chapter: '02 / HARVEST',
      line: 'Hand-picked at peak Brix maturity across Bhopal & Ratnagiri.',
    };
  }
  if (pct < 0.58) {
    return {
      chapter: '03 / EXTRACTION',
      line: '10,000 lbs of cold hydraulic extraction at 0°C.',
    };
  }
  if (pct < 0.78) {
    return {
      chapter: '04 / PURITY',
      line: '100% unfiltered raw nectar — zero concentrates or added sugar.',
    };
  }
  return {
    chapter: '05 / CRAFT',
    line: 'Italian crystal relief glass sealed in sustainably harvested oak.',
  };
}

function CinemaReelPlayer({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameFloatRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);
  const isPlayingRef = useRef(true);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const { getNearestLoadedFrame, isReady, progress } = useImageSequence({
    frameCount: TOTAL_FRAMES,
    isActive: true,
  });

  const drawFrameToCanvas = useCallback(
    (frameIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      const img = getNearestLoadedFrame(frameIdx);
      if (!ctx || !img) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(canvas.clientWidth * dpr);
      const targetH = Math.round(canvas.clientHeight * dpr);
      if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      if (canvas.width === 0 || canvas.height === 0) return;

      const srcW = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
      const srcH = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;
      if (!srcW || !srcH) return;

      const scale = Math.max(canvas.width / srcW, canvas.height / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const dx = (canvas.width - drawW) * 0.5;
      const dy = (canvas.height - drawH) * 0.5;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, drawW, drawH);
    },
    [getNearestLoadedFrame]
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isReady && isPlayingRef.current) {
        let next = frameFloatRef.current + dt * FPS;
        if (next >= TOTAL_FRAMES) {
          next = 0;
        }
        frameFloatRef.current = next;
      }

      const discrete = Math.min(TOTAL_FRAMES - 1, Math.floor(frameFloatRef.current));
      if (discrete !== lastDrawnFrameRef.current || lastDrawnFrameRef.current === -1) {
        drawFrameToCanvas(discrete);
        lastDrawnFrameRef.current = discrete;
        setCurrentFrame(discrete);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isReady, drawFrameToCanvas]);

  const handleTogglePlay = () => {
    luxuryAudio.playClick();
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    luxuryAudio.playClick();
    frameFloatRef.current = 0;
    lastDrawnFrameRef.current = -1;
    setCurrentFrame(0);
    setIsPlaying(true);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    frameFloatRef.current = val;
    lastDrawnFrameRef.current = -1;
    setCurrentFrame(val);
  };

  const caption = getCaptionForFrame(currentFrame);
  const currentSec = Math.floor(currentFrame / FPS);
  const totalSec = Math.floor(TOTAL_FRAMES / FPS);
  const formatTime = (s: number) => `00:${String(s).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      data-lenis-prevent
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="ÉLAN Brand Film Screening Room"
      className="relative w-full max-w-5xl bg-elan-dark border border-elan-gold/35 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col"
    >
      {/* Top Cinema Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-elan-gold" />
          <span className="text-[10px] font-sans tracking-[0.35em] uppercase text-elan-gold font-medium">
            ÉLAN SCREENING ROOM • BHOPAL HARVEST FILM
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close film screening modal"
          className="p-2 rounded-full border border-white/15 text-elan-cream hover:text-elan-gold hover:border-elan-gold transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* 16:9 Cinema Stage */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {!isReady && (
          <div className="absolute inset-0 bg-elan-dark flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border border-elan-gold/40 border-t-elan-gold animate-spin" />
            <span className="text-[10px] font-serif tracking-[0.3em] uppercase text-elan-gold">
              PREPARING REEL ({Math.round(progress * 100)}%)
            </span>
          </div>
        )}

        {/* Cinematic Subtitles Vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-6 pt-14 pb-6 flex flex-col items-center text-center">
          <span className="text-[9px] font-sans tracking-[0.35em] uppercase text-elan-gold mb-1">
            {caption.chapter}
          </span>
          <p className="font-serif italic text-base sm:text-xl text-elan-cream/95 max-w-2xl">
            {caption.line}
          </p>
        </div>
      </div>

      {/* Cinema Playback Scrubber Controls */}
      <div className="px-6 py-4 bg-black/75 border-t border-white/10 flex items-center gap-4">
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? 'Pause brand film' : 'Play brand film'}
          className="p-2.5 rounded-full border border-elan-gold/40 bg-elan-gold/10 text-elan-gold hover:bg-elan-gold hover:text-elan-dark transition-all"
        >
          {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={handleRestart}
          aria-label="Restart film from beginning"
          className="p-2.5 rounded-full border border-white/15 text-elan-cream/70 hover:text-elan-gold hover:border-elan-gold/40 transition-all"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>

        <input
          type="range"
          min={0}
          max={TOTAL_FRAMES - 1}
          value={currentFrame}
          onChange={handleScrub}
          aria-label="Scrub film timeline"
          className="flex-1 accent-[#C8A96A] cursor-pointer h-1.5 bg-white/10 rounded-full"
        />

        <span className="text-xs font-sans tracking-wider text-elan-cream/70 tabular-nums">
          {formatTime(currentSec)} / {formatTime(totalSec)}
        </span>
      </div>
    </motion.div>
  );
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-2xl"
    >
      <CinemaReelPlayer onClose={onClose} />
    </div>
  );
}
