import type Lenis from 'lenis';

let activeLenis: Lenis | null = null;

/**
 * Register or clear the singleton Lenis smooth-scroll instance.
 */
export function setLenisInstance(instance: Lenis | null) {
  activeLenis = instance;
}

/**
 * Scroll smoothly using Lenis when available, falling back to native scrollTo.
 */
export function smoothScrollTo(target: number, duration = 0.9) {
  if (typeof window === 'undefined') return;
  if (activeLenis) {
    activeLenis.scrollTo(target, { duration });
  } else {
    window.scrollTo({ top: target, behavior: 'smooth' });
  }
}

/**
 * Scroll smoothly by a relative vertical pixel offset using Lenis when available.
 */
export function smoothScrollBy(deltaY: number, duration = 0.65) {
  if (typeof window === 'undefined') return;
  if (activeLenis) {
    const base = activeLenis.targetScroll ?? window.scrollY;
    const next = Math.max(0, Math.min(activeLenis.limit, base + deltaY));
    activeLenis.scrollTo(next, { duration });
  } else {
    window.scrollBy({ top: deltaY, behavior: 'smooth' });
  }
}

/**
 * Temporarily pause or resume Lenis scrolling (e.g. when a modal is open).
 */
export function setLenisPaused(paused: boolean) {
  if (!activeLenis) return;
  if (paused) {
    activeLenis.stop();
  } else {
    activeLenis.start();
  }
}

