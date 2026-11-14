'use client';

import { useEffect, useRef } from 'react';

export function MouseLight() {
  const lightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let animationId: number | null = null;
    let initialized = false;

    const updatePosition = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }

      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
        animationId = requestAnimationFrame(updatePosition);
      } else {
        currentX = targetX;
        currentY = targetY;
        if (lightRef.current) {
          lightRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
        }
        animationId = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!initialized) {
        initialized = true;
        currentX = targetX;
        currentY = targetY;
      }

      if (animationId === null) {
        animationId = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId !== null) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={lightRef}
      className="pointer-events-none fixed top-0 left-0 w-[500px] h-[500px] rounded-full z-10 hidden md:block will-change-transform opacity-60"
      style={{
        background: 'radial-gradient(circle, rgba(200, 169, 106, 0.07) 0%, transparent 70%)',
        transform: 'translate3d(-1000px, -1000px, 0)',
      }}
    />
  );
}
