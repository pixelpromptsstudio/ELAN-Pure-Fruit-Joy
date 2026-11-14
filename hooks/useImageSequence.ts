'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAssetPath } from '../lib/utils';

interface UseImageSequenceOptions {
  folderPath?: string;
  frameCount?: number; // 240
  isActive?: boolean;
}

export type DrawableFrame = HTMLImageElement | ImageBitmap;

function isImageBitmap(frame: DrawableFrame | null): frame is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && frame instanceof ImageBitmap;
}

function isPinnedFrame(index: number, frameCount: number): boolean {
  return index <= 24 || index === frameCount - 1 || index % 4 === 0;
}

function releaseFrameArray(frames: (DrawableFrame | null)[], clear = false): void {
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (isImageBitmap(frame)) {
      frame.close();
    }
    if (clear) {
      frames[i] = null;
    }
  }
}

export function useImageSequence({
  folderPath,
  frameCount = 240,
  isActive = true,
}: UseImageSequenceOptions = {}) {
  const framesRef = useRef<(DrawableFrame | null)[]>(new Array(frameCount).fill(null));
  const blobsRef = useRef<(Blob | null)[]>(new Array(frameCount).fill(null));
  const inFlightRef = useRef<Set<number>>(new Set());
  const failedRef = useRef<Set<number>>(new Set());

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  const isReadyRef = useRef(false);
  const activeTargetRef = useRef<number>(0);
  const lastTargetRef = useRef<number>(0);
  const scrollDirRef = useRef<1 | -1>(1);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;
  const rehydrateRef = useRef<((centerIndex: number) => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;
    const isMobile = window.innerWidth < 768;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const useMemoryCap = isMobile || deviceMemory < 4;
    const maxDecodedFrames = isMobile ? 115 : 240;

    const chosenFolder = folderPath || (isMobile ? '/pr_seq_mobile' : '/pr_seq');
    const base = getAssetPath(chosenFolder);

    // Reset sequence state cleanly for this folder/frameCount
    releaseFrameArray(framesRef.current, true);
    const frames: (DrawableFrame | null)[] = new Array(frameCount).fill(null);
    const blobs: (Blob | null)[] = new Array(frameCount).fill(null);
    framesRef.current = frames;
    blobsRef.current = blobs;
    inFlightRef.current = new Set();
    failedRef.current = new Set();

    isReadyRef.current = false;
    setIsReady(false);
    setIsFullyLoaded(false);
    setLoadedCount(0);

    let decodedCount = 0;
    let fetchedUniqueCount = 0;
    const seenFetched = new Set<number>();

    const evictIfNeeded = (protectIndex: number) => {
      if (!useMemoryCap || decodedCount <= maxDecodedFrames) return;

      const target = activeTargetRef.current;
      let farthestIdx = -1;
      let farthestDist = -1;

      for (let i = 0; i < frameCount; i++) {
        if (!frames[i] || i === protectIndex || isPinnedFrame(i, frameCount)) continue;
        const dist = Math.abs(i - target);
        if (dist > farthestDist) {
          farthestDist = dist;
          farthestIdx = i;
        }
      }

      if (farthestIdx !== -1) {
        const victim = frames[farthestIdx];
        if (isImageBitmap(victim)) {
          victim.close();
        }
        frames[farthestIdx] = null;
        decodedCount--;
      }
    };

    const markFrameReady = (index: number, frame: DrawableFrame) => {
      if (!frames[index]) {
        decodedCount++;
      }
      frames[index] = frame;
      evictIfNeeded(index);

      if (!seenFetched.has(index)) {
        seenFetched.add(index);
        fetchedUniqueCount++;
      }

      if (!isReadyRef.current && (index === 0 || fetchedUniqueCount >= 2)) {
        isReadyRef.current = true;
        setIsReady(true);
        setLoadedCount(fetchedUniqueCount);
      } else if (!isReadyRef.current) {
        setLoadedCount(fetchedUniqueCount);
      }

      if (fetchedUniqueCount >= frameCount) {
        setLoadedCount(frameCount);
        setIsFullyLoaded(true);
      }
    };

    const decodeImageElement = async (url: string): Promise<DrawableFrame> => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      if (typeof img.decode === 'function') {
        await img.decode();
      } else {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${url}`));
        });
      }
      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        try {
          return await createImageBitmap(img);
        } catch {
          return img;
        }
      }
      return img;
    };

    const loadFrame = async (index: number, urgent = false): Promise<DrawableFrame | null> => {
      if (index < 0 || index >= frameCount || isCancelled) return null;
      if (frames[index]) return frames[index];
      if (inFlightRef.current.has(index)) return null;

      inFlightRef.current.add(index);
      const pad = String(index).padStart(3, '0');
      const url = `${base}/frame_${pad}.webp`;

      try {
        // Fast path: re-decode from retained compressed Blob if previously evicted on mobile
        const cachedBlob = blobs[index];
        if (cachedBlob && 'createImageBitmap' in window) {
          const bitmap = await createImageBitmap(cachedBlob);
          if (isCancelled) {
            bitmap.close();
            return null;
          }
          markFrameReady(index, bitmap);
          return bitmap;
        }

        let frame: DrawableFrame;

        // Frames 0..2 match <link rel="preload" as="image"> cleanly with zero duplicate fetch
        if (index <= 2 || !('createImageBitmap' in window)) {
          frame = await decodeImageElement(url);
        } else {
          const fetchOpts: RequestInit & { priority?: 'high' | 'low' | 'auto' } = {
            cache: 'force-cache',
            priority: urgent ? 'high' : 'auto',
          };
          const response = await fetch(url, fetchOpts);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          if (useMemoryCap && !isPinnedFrame(index, frameCount)) {
            blobs[index] = blob;
          }
          frame = await createImageBitmap(blob);
        }

        if (isCancelled) {
          if (isImageBitmap(frame)) frame.close();
          return null;
        }

        markFrameReady(index, frame);
        return frame;
      } catch {
        try {
          const fallbackFrame = await decodeImageElement(url);
          if (!isCancelled) {
            markFrameReady(index, fallbackFrame);
            return fallbackFrame;
          }
          if (isImageBitmap(fallbackFrame)) fallbackFrame.close();
        } catch {
          failedRef.current.add(index);
        }
      } finally {
        inFlightRef.current.delete(index);
      }

      return null;
    };

    // Pick next unloaded frame closest to the user's current scroll position & direction
    const pickNearTarget = (radius: number, onlyUnseen = true): number | null => {
      const target = activeTargetRef.current;
      const dir = scrollDirRef.current;

      for (let offset = 0; offset <= radius; offset++) {
        const primary = target + offset * dir;
        if (
          primary >= 0 &&
          primary < frameCount &&
          !frames[primary] &&
          !inFlightRef.current.has(primary) &&
          (!onlyUnseen || !failedRef.current.has(primary))
        ) {
          return primary;
        }
        if (offset > 0) {
          const secondary = target - offset * dir;
          if (
            secondary >= 0 &&
            secondary < frameCount &&
            !frames[secondary] &&
            !inFlightRef.current.has(secondary) &&
            (!onlyUnseen || !failedRef.current.has(secondary))
          ) {
            return secondary;
          }
        }
      }
      return null;
    };

    const runPriorityQueue = async (
      queue: number[],
      concurrency: number,
      allowTargetPreempt: boolean
    ) => {
      let cursor = 0;

      const worker = async () => {
        while (!isCancelled) {
          // If user scrolled to another spot, prioritize frames right around their viewport
          let nextIdx: number | null = null;
          if (allowTargetPreempt) {
            nextIdx = pickNearTarget(6);
          }

          while (nextIdx === null && cursor < queue.length) {
            const candidate = queue[cursor++];
            if (!frames[candidate] && !inFlightRef.current.has(candidate)) {
              nextIdx = candidate;
            }
          }

          if (nextIdx === null) break;

          // If offscreen, yield slightly so below-fold section images load cleanly
          if (!isActiveRef.current) {
            await new Promise((r) => setTimeout(r, 40));
          }

          await loadFrame(nextIdx, allowTargetPreempt && Math.abs(nextIdx - activeTargetRef.current) <= 8);
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));
    };

    const runDynamicTargetFill = async (concurrency: number) => {
      const worker = async () => {
        while (!isCancelled) {
          const nextIdx = pickNearTarget(frameCount);
          if (nextIdx === null) break;

          if (!isActiveRef.current) {
            await new Promise((r) => setTimeout(r, 60));
          }

          await loadFrame(nextIdx, Math.abs(nextIdx - activeTargetRef.current) <= 12);
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));
    };

    const startLoadingPipeline = async () => {
      // TIER 0: Paint frame 0 immediately
      await loadFrame(0, true);
      if (isCancelled) return;

      // TIER 1: Opening scrub buffer (frames 1..18) for instant landing scroll
      const introBuffer: number[] = [];
      for (let i = 1; i <= Math.min(18, frameCount - 1); i++) {
        introBuffer.push(i);
      }
      await runPriorityQueue(introBuffer, isMobile ? 4 : 6, true);
      if (isCancelled) return;

      // TIER 2: Remaining intro (19..24) + Keyframe skeleton (stride = 4 across timeline)
      const keyframes: number[] = [];
      for (let i = 19; i <= Math.min(24, frameCount - 1); i++) {
        keyframes.push(i);
      }
      for (let i = 28; i < frameCount; i += 4) {
        keyframes.push(i);
      }
      if (!keyframes.includes(frameCount - 1)) {
        keyframes.push(frameCount - 1);
      }
      await runPriorityQueue(keyframes, isMobile ? 4 : 6, true);
      if (isCancelled) return;

      // TIER 3: Progressive fill radiating outward from the user's live scroll position
      const scheduleFill = () => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
            () => {
              if (!isCancelled) runDynamicTargetFill(isMobile ? 3 : 4);
            },
            { timeout: 600 }
          );
        } else {
          setTimeout(() => {
            if (!isCancelled) runDynamicTargetFill(isMobile ? 3 : 4);
          }, 50);
        }
      };

      scheduleFill();
    };

    rehydrateRef.current = (centerIndex: number) => {
      if (isCancelled || !useMemoryCap) return;
      const dir = scrollDirRef.current;
      for (let offset = 0; offset <= 6; offset++) {
        const candidates = offset === 0 ? [centerIndex] : [centerIndex + offset * dir, centerIndex - offset * dir];
        for (const idx of candidates) {
          if (idx >= 0 && idx < frameCount && !frames[idx] && blobs[idx] && !inFlightRef.current.has(idx)) {
            void loadFrame(idx, true);
          }
        }
      }
    };

    startLoadingPipeline();

    return () => {
      isCancelled = true;
      rehydrateRef.current = null;
      releaseFrameArray(framesRef.current, true);
      blobsRef.current = [];
    };
  }, [folderPath, frameCount]);

  // Fast nearest frame finder + predictive target tracking
  const getNearestLoadedFrame = useCallback(
    (targetIndex: number): DrawableFrame | null => {
      const frames = framesRef.current;
      const safeIndex = Math.min(frameCount - 1, Math.max(0, targetIndex));

      if (safeIndex !== lastTargetRef.current) {
        scrollDirRef.current = safeIndex >= lastTargetRef.current ? 1 : -1;
        lastTargetRef.current = safeIndex;
      }
      activeTargetRef.current = safeIndex;

      if (frames[safeIndex]) {
        return frames[safeIndex];
      }

      if (blobsRef.current[safeIndex]) {
        rehydrateRef.current?.(safeIndex);
      }

      // Radiate outward to nearest decoded frame
      for (let offset = 1; offset < frameCount; offset++) {
        const prev = safeIndex - offset;
        const next = safeIndex + offset;
        if (prev >= 0 && frames[prev]) {
          return frames[prev];
        }
        if (next < frameCount && frames[next]) {
          return frames[next];
        }
      }

      return null;
    },
    [frameCount]
  );

  const progress = frameCount > 0 ? loadedCount / frameCount : 0;

  return {
    frames: framesRef.current,
    framesRef,
    images: framesRef.current as unknown as HTMLImageElement[],
    imagesRef: framesRef as unknown as React.MutableRefObject<(HTMLImageElement | null)[]>,
    getNearestLoadedFrame,
    loadedCount,
    isLoaded: isReady || loadedCount >= 2,
    isReady: isReady || loadedCount >= 2,
    isFullyLoaded,
    progress,
    frameCount,
  };
}
