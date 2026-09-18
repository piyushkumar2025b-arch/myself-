import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import profilePhoto from '../assets/images/file_00000000e1b07209be42c334776495c9.png';

interface HeroVisual3DProps {
  imageSrc?: string;
  altText: string;
  enable3D?: boolean;
  className?: string;
  badgeContent?: React.ReactNode;
  onImageChange?: (newImageUrl: string) => void;
}

export const HeroVisual3D: React.FC<HeroVisual3DProps> = ({
  imageSrc,
  altText,
  enable3D = true,
  className = "",
  badgeContent,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Use the exact uploaded asset as definitive source
  const safeProfileSrc = profilePhoto || imageSrc || '/assets/images/profile.png';

  const shouldReduceMotion = useReducedMotion();
  const is3DActive = enable3D && !shouldReduceMotion;

  // Mouse position normalized (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for smooth, physical 3D feel
  const springConfig = { damping: 22, stiffness: 140, mass: 0.45 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Transforms for 3D rotation & parallax depth
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  
  // Parallax layers
  const imageTranslateX = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const imageTranslateY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);
  const imageScale = useTransform(smoothX, [-0.5, 0.5], [1.02, 1.035]);
  
  const badgeTranslateX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const badgeTranslateY = useTransform(smoothY, [-0.5, 0.5], [12, -12]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DActive || !cardRef.current) return;
    if (!rectRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    const rect = rectRef.current;
    const x = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
    const y = (e.clientY - rect.top) / (rect.height || 1) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      className={`relative select-none ${className}`}
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: is3DActive ? rotateX : 0,
          rotateY: is3DActive ? rotateY : 0,
          transformStyle: is3DActive ? 'preserve-3d' : 'flat',
        }}
        className="relative w-full max-w-[480px] lg:max-w-[500px] aspect-[4/4.3] rounded-[28px] p-[2px] transition-shadow duration-500 glow-shadow-subtle glow-shadow-hover group"
      >
        {/* 3D Extruded Transparent Theme Side Walls (Revealed in 3D tilt mode) */}
        {is3DActive && (
          <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
            {/* Left side wall */}
            <div 
              className="absolute left-0 top-3 bottom-3 w-[22px] origin-left rounded-l-lg border-y border-l border-emerald-400/40 transition-opacity duration-300 pointer-events-none"
              style={{
                transform: 'rotateY(-90deg) translateZ(0px)',
                background: 'linear-gradient(to right, rgba(16, 242, 150, 0.35), rgba(6, 182, 212, 0.15))',
                boxShadow: '0 0 16px rgba(16, 242, 150, 0.30)',
              }}
            />
            {/* Right side wall */}
            <div 
              className="absolute right-0 top-3 bottom-3 w-[22px] origin-right rounded-r-lg border-y border-r border-cyan-400/40 transition-opacity duration-300 pointer-events-none"
              style={{
                transform: 'rotateY(90deg) translateZ(0px)',
                background: 'linear-gradient(to left, rgba(6, 182, 212, 0.35), rgba(16, 242, 150, 0.15))',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.30)',
              }}
            />
            {/* Top side wall */}
            <div 
              className="absolute top-0 left-3 right-3 h-[22px] origin-top rounded-t-lg border-x border-t border-emerald-400/40 transition-opacity duration-300 pointer-events-none"
              style={{
                transform: 'rotateX(90deg) translateZ(0px)',
                background: 'linear-gradient(to bottom, rgba(16, 242, 150, 0.35), rgba(6, 182, 212, 0.15))',
                boxShadow: '0 0 16px rgba(16, 242, 150, 0.30)',
              }}
            />
            {/* Bottom side wall */}
            <div 
              className="absolute bottom-0 left-3 right-3 h-[22px] origin-bottom rounded-b-lg border-x border-b border-cyan-400/40 transition-opacity duration-300 pointer-events-none"
              style={{
                transform: 'rotateX(-90deg) translateZ(0px)',
                background: 'linear-gradient(to top, rgba(6, 182, 212, 0.35), rgba(16, 242, 150, 0.15))',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.30)',
              }}
            />
          </div>
        )}

        {/* Continuous Multi-stop Glowing Gradient Border */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-emerald-500 via-cyan-400 via-purple-500 to-fuchsia-500 p-[2px] -z-10 animate-pulse-slow">
          <div className="w-full h-full rounded-[26px] bg-[#0c1426]" />
        </div>

        {/* Outer ambient glow backlight */}
        <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-emerald-500/22 via-cyan-500/18 to-purple-600/20 blur-2xl -z-20 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Card inner container */}
        <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#101b33] via-[#0d1629] to-[#080e1c] overflow-hidden flex items-end justify-center border border-white/10">
          
          {/* Subtle geometric lighting grid / radial backdrop inside card */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/25 via-slate-900/40 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Right Floating 3D Badge */}
          <motion.div
            style={{
              x: is3DActive ? badgeTranslateX : 0,
              y: is3DActive ? badgeTranslateY : 0,
              translateZ: is3DActive ? 35 : 0,
            }}
            className="absolute top-5 right-5 z-20"
          >
            {badgeContent || (
              <div className="w-10 h-10 rounded-full bg-[#101a2e]/90 border border-cyan-400/30 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-950/40 group-hover:scale-110 transition-transform duration-300">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-500 p-[1.5px] animate-spin-slow">
                  <div className="w-full h-full bg-[#0a1120] rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Developer Portrait / Visual Cutout with 3D Depth */}
          <motion.div
            style={{
              x: is3DActive ? imageTranslateX : 0,
              y: is3DActive ? imageTranslateY : 0,
              scale: is3DActive ? imageScale : 1,
              translateZ: is3DActive ? 20 : 0,
            }}
            className="relative w-full h-[95%] flex items-end justify-center pointer-events-none z-10"
          >
            <img
              src={safeProfileSrc}
              alt={altText}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/profile.png';
              }}
            />
            
            {/* Bottom soft gradient blend into card base */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080e1c] via-[#080e1c]/70 to-transparent pointer-events-none" />
          </motion.div>

          {/* Floating Spatial HUD Status Chip (Bottom-Left 3D Layer) */}
          <motion.div
            style={{
              x: is3DActive ? badgeTranslateX : 0,
              y: is3DActive ? badgeTranslateY : 0,
              translateZ: is3DActive ? 42 : 0,
            }}
            className="absolute bottom-5 left-5 z-20 pointer-events-none hidden sm:block"
          >
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1628]/92 border border-emerald-400/35 backdrop-blur-xl shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#10f296]"></span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-200 tracking-wider">
                CORE // <span className="text-emerald-400">VIT CHENNAI</span>
              </span>
            </div>
          </motion.div>

          {/* Interactive cursor light reflection */}
          {is3DActive && isHovered && (
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none mix-blend-overlay"
              style={{
                background: `radial-gradient(circle 240px at ${((mouseX.get() + 0.5) * 100).toFixed(1)}% ${((mouseY.get() + 0.5) * 100).toFixed(1)}%, rgba(255,255,255,0.07), transparent 75%)`
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};
