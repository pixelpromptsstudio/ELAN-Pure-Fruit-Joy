'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAssetPath } from '../lib/utils';

interface UseImageSequenceOptions {
  folderPath: string; // e.g. '/pr1_seq'
  frameCount: number; // 240
}

export function useImageSequence({ folderPath, frameCount }: UseImageSequenceOptions) {
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(frameCount).fill(null));
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false); // True once initial keyframes are available
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const base = getAssetPath(folderPath || '/pr1_seq');
    const images = imagesRef.current;
    let localLoaded = 0;

    // Helper to load and decode a single frame
    const loadFrame = async (index: number): Promise<HTMLImageElement | null> => {
      if (images[index] || isCancelled) return images[index];

      const pad = String(index).padStart(3, '0');
      const img = new Image();
      img.src = `${base}/frame_${pad}.webp`;

      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        } else {
          await new Promise<void>((resolve, reject) => {
            (img as HTMLImageElement).onload = () => resolve();
            (img as HTMLImageElement).onerror = reject;
          });
        }
      } catch {
        // Fallback or retry
      }

      if (isCancelled) return null;
      images[index] = img;
      localLoaded++;

      // Trigger ready when initial keyframes are available (e.g. 12 keyframes loaded)
      if (localLoaded >= 12 && !isReady) {
        setIsReady(true);
      }

      if (localLoaded === 1 || localLoaded % 10 === 0 || localLoaded === frameCount) {
        setLoadedCount(localLoaded);
      }

      if (localLoaded >= frameCount) {
        setIsFullyLoaded(true);
      }

      return img;
    };

    // Stride for Phase 1 keyframes: sample every 4th frame across the entire timeline
    // This guarantees that ANY scroll position (0% - 100%) immediately has a nearby frame within 3 frames!
    const keyframeIndices: number[] = [];
    const stride = 4;
    for (let i = 0; i < frameCount; i += stride) {
      keyframeIndices.push(i);
    }
    // Also include the first 8 consecutive frames for seamless instant landing
    for (let i = 0; i < Math.min(8, frameCount); i++) {
      if (!keyframeIndices.includes(i)) keyframeIndices.push(i);
    }
    // Also include the last frame
    if (!keyframeIndices.includes(frameCount - 1)) {
      keyframeIndices.push(frameCount - 1);
    }

    const intermediateIndices: number[] = [];
    for (let i = 0; i < frameCount; i++) {
      if (!keyframeIndices.includes(i)) {
        intermediateIndices.push(i);
      }
    }

    // Phase 1: Rapid keyframe loading with controlled concurrency (6 parallel streams)
    const loadBatch = async (indices: number[], concurrency: number) => {
      let idx = 0;
      const workers = Array.from({ length: concurrency }, async () => {
        while (idx < indices.length && !isCancelled) {
          const current = indices[idx++];
          await loadFrame(current);
        }
      });
      await Promise.all(workers);
    };

    const startLoading = async () => {
      // 1. Load frame 0 first for instant paint
      await loadFrame(0);
      if (isCancelled) return;

      // 2. Load all keyframes across the entire sequence (fast ~2MB total)
      await loadBatch(keyframeIndices, 6);
      if (isCancelled) return;

      // 3. Progressive background fill of intermediate frames without blocking main thread
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(
          () => {
            if (!isCancelled) loadBatch(intermediateIndices, 4);
          },
          { timeout: 1500 }
        );
      } else {
        setTimeout(() => {
          if (!isCancelled) loadBatch(intermediateIndices, 4);
        }, 100);
      }
    };

    startLoading();

    return () => {
      isCancelled = true;
    };
  }, [folderPath, frameCount]);

  // Fast nearest frame finder: O(1) or small bounded step
  const getNearestLoadedFrame = useCallback(
    (targetIndex: number): HTMLImageElement | null => {
      const images = imagesRef.current;
      const safeIndex = Math.min(frameCount - 1, Math.max(0, targetIndex));

      if (images[safeIndex] && images[safeIndex]!.naturalWidth > 0) {
        return images[safeIndex];
      }

      // Search radiating outward
      for (let offset = 1; offset < frameCount; offset++) {
        const prev = safeIndex - offset;
        const next = safeIndex + offset;
        if (prev >= 0 && images[prev] && images[prev]!.naturalWidth > 0) {
          return images[prev];
        }
        if (next < frameCount && images[next] && images[next]!.naturalWidth > 0) {
          return images[next];
        }
      }

      return null;
    },
    [frameCount]
  );

  const progress = frameCount > 0 ? loadedCount / frameCount : 0;

  return {
    images: imagesRef.current,
    imagesRef,
    getNearestLoadedFrame,
    loadedCount,
    isLoaded: isReady || loadedCount >= 8,
    isReady: isReady || loadedCount >= 8,
    isFullyLoaded,
    progress,
    frameCount,
  };
}
