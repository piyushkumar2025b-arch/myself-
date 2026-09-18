import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  tiltMax?: number;
  glowColor?: string; // e.g. 'rgba(52, 211, 153, 0.12)' or 'rgba(56, 189, 248, 0.12)'
  borderGlowColor?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  enableTilt = false,
  tiltMax = 2,
  glowColor = 'rgba(16, 242, 150, 0.08)',
  borderGlowColor = 'rgba(16, 242, 150, 0.32)',
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse normalized for tilt (-0.5 to 0.5)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 180, mass: 0.3 };
  const smoothTiltX = useSpring(tiltX, springConfig);
  const smoothTiltY = useSpring(tiltY, springConfig);

  const rotateX = useTransform(smoothTiltY, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const rotateY = useTransform(smoothTiltX, [-0.5, 0.5], [-tiltMax, tiltMax]);

  const handlePointerEnter = () => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (!rectRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS variables directly on DOM node for ultra-high performance (zero re-renders)
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    if (enableTilt && !shouldReduceMotion) {
      tiltX.set(x / (rect.width || 1) - 0.5);
      tiltY.set(y / (rect.height || 1) - 0.5);
    }
  };

  const handlePointerLeave = () => {
    rectRef.current = null;
    if (!cardRef.current) return;
    if (enableTilt && !shouldReduceMotion) {
      tiltX.set(0);
      tiltY.set(0);
    }
  };

  const is3DActive = enableTilt && !shouldReduceMotion;

  return (
    <motion.div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX: is3DActive ? rotateX : 0,
        rotateY: is3DActive ? rotateY : 0,
        transformStyle: is3DActive ? 'preserve-3d' : 'flat',
        ...style,
      }}
      className={`glow-card card-chiseled group relative rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-emerald-500/35 shadow-xl shadow-black/40 transition-all duration-300 ${className}`}
      {...(props as any)}
    >
      {/* Background Radial Glow Highlight that follows cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Subtle border highlight that follows cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          border: '1px solid transparent',
          background: `radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${borderGlowColor}, transparent 65%) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {children}
    </motion.div>
  );
};
