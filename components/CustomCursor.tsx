'use client';

import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animationId: number | null = null;
    let lastHoveredState = false;
    let lastText = '';
    let isPointerInside = false;

    const setCursorVisible = (visible: boolean) => {
      if (dotRef.current) dotRef.current.style.visibility = visible ? 'visible' : 'hidden';
      if (ringRef.current) ringRef.current.style.visibility = visible ? 'visible' : 'hidden';
    };

    const render = () => {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (ringRef.current) {
        const offset = lastHoveredState ? 36 : 16;
        ringRef.current.style.transform = `translate3d(${ringX - offset}px, ${ringY - offset}px, 0)`;
      }

      if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
        animationId = requestAnimationFrame(render);
      } else {
        ringX = mouseX;
        ringY = mouseY;
        if (ringRef.current) {
          const offset = lastHoveredState ? 36 : 16;
          ringRef.current.style.transform = `translate3d(${ringX - offset}px, ${ringY - offset}px, 0)`;
        }
        animationId = null;
      }
    };

    const scheduleRender = () => {
      if (animationId === null) {
        animationId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isPointerInside) {
        isPointerInside = true;
        ringX = mouseX;
        ringY = mouseY;
        setCursorVisible(true);
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
      }

      const target = e.target as HTMLElement | null;
      const hoverable = target?.closest('[data-cursor]');
      const nextHovered = !!hoverable;
      const nextText = hoverable ? hoverable.getAttribute('data-cursor') || '' : '';

      if (nextHovered !== lastHoveredState || nextText !== lastText) {
        lastHoveredState = nextHovered;
        lastText = nextText;
        setIsHovered(nextHovered);
        setCursorText(nextText);
      }

      scheduleRender();
    };

    const handleMouseLeave = () => {
      isPointerInside = false;
      setCursorVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationId !== null) cancelAnimationFrame(animationId);
    };
  }, []);

  if (isTouch) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border flex items-center justify-center transition-[width,height,background-color,border-color] duration-200 will-change-transform ${
          isHovered
            ? 'w-[72px] h-[72px] border-elan-gold/80 bg-elan-gold/15'
            : 'w-8 h-8 border-elan-gold/40 bg-elan-gold/5'
        }`}
        style={{ transform: 'translate3d(-100px, -100px, 0)', visibility: 'hidden' }}
      >
        {cursorText && (
          <span
            ref={textRef}
            className="text-[10px] tracking-[0.2em] font-serif uppercase text-elan-cream font-medium"
          >
            {cursorText}
          </span>
        )}
      </div>

      {/* Inner Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 w-2 h-2 rounded-full bg-elan-gold shadow-[0_0_8px_rgba(200,169,106,0.8)] will-change-transform transition-opacity duration-200 ${
          isHovered ? 'opacity-30' : 'opacity-100'
        }`}
        style={{ transform: 'translate3d(-100px, -100px, 0)', visibility: 'hidden' }}
      />
    </div>
  );
}
