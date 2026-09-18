import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CinematicLandingPage } from './CinematicLandingPage';
import { Sparkles, ChevronUp } from 'lucide-react';
import { cyberAudio } from '../../utils/cyberAudio';

interface PortfolioEntranceManagerProps {
  children: React.ReactNode;
}

const INTRO_HEIGHT_MULTIPLIER = 2.4;

export const PortfolioEntranceManager: React.FC<PortfolioEntranceManagerProps> = ({ children }) => {
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [isEntered, setIsEntered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const prevProgressRef = useRef(0);
  const prevEnteredRef = useRef(false);
  const rafIdRef = useRef<number>(0);

  // Optimized throttled scroll handling with direct DOM manipulation for silky 120 FPS
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const trackHeight = window.innerHeight * (INTRO_HEIGHT_MULTIPLIER - 1);
      const rawProgress = scrollY / Math.max(trackHeight, 1);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const entered = progress >= 0.88;

      // Update DOM opacity & pointer events directly to eliminate React reconciliation bottlenecks
      if (stageRef.current) {
        const pOpacity = Math.max(0, Math.min(1, (progress - 0.75) / 0.2));
        stageRef.current.style.opacity = String(pOpacity);
        if (progress < 0.75) {
          stageRef.current.style.pointerEvents = 'none';
        } else {
          stageRef.current.style.pointerEvents = 'auto';
        }
      }

      // Only trigger React state updates when entering boundary toggles or when progress changes meaningfully
      const delta = Math.abs(progress - prevProgressRef.current);
      const crossedBoundary = (progress === 0 && prevProgressRef.current !== 0) || (progress === 1 && prevProgressRef.current !== 1);
      const enteredChanged = entered !== prevEnteredRef.current;

      if (delta >= 0.02 || crossedBoundary || enteredChanged) {
        prevProgressRef.current = progress;
        prevEnteredRef.current = entered;
        setScrollProgress(progress);
        setIsEntered(entered);
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll]);

  // Programmatic smooth jump into the portfolio
  const handleEnterPortfolio = useCallback((targetSectionId: string = 'home') => {
    if (typeof window === 'undefined') return;

    cyberAudio.playEnterTransition();
    isProgrammaticScroll.current = true;

    const trackHeight = window.innerHeight * (INTRO_HEIGHT_MULTIPLIER - 1);
    
    if (targetSectionId === 'home') {
      window.scrollTo({
        top: trackHeight + 50,
        behavior: 'smooth',
      });
    } else {
      const targetEl = document.getElementById(targetSectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({
          top: trackHeight + 50,
          behavior: 'smooth',
        });
      }
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 1200);
  }, []);

  // Return back to top 3D Chamber
  const handleReturnToChamber = () => {
    cyberAudio.playHoverBlip();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Smooth opacity calculation for portfolio appearance
  const portfolioOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.75) / 0.2));

  // Memoize children to prevent re-rendering massive portfolio subtree on scroll
  const memoizedChildren = useMemo(() => children, [children]);

  return (
    <div className="relative w-full">
      {/* 1. Scroll track driving the 3D cinematic camera journey */}
      <div 
        ref={trackRef} 
        id="intro-scroll-track" 
        className="w-full relative pointer-events-none"
        style={{ height: `${INTRO_HEIGHT_MULTIPLIER * 100}vh` }}
      />

      {/* 2. Fixed 3D Landing Page Stage */}
      <CinematicLandingPage
        scrollProgress={scrollProgress}
        isEntered={isEntered}
        onEnterPortfolio={handleEnterPortfolio}
      />

      {/* 3. Main Portfolio Website Stage */}
      <div 
        ref={stageRef}
        id="main-portfolio-stage" 
        className={`relative w-full z-20 transition-opacity duration-500 ${
          scrollProgress < 0.75 ? 'pointer-events-none opacity-0' : 'pointer-events-auto'
        }`}
        style={{
          marginTop: '-100vh',
          opacity: portfolioOpacity,
        }}
      >
        {memoizedChildren}
      </div>

      {/* 4. Subtle Floating Return to 3D Chamber pill (visible when browsing portfolio) */}
      {isEntered && (
        <div className="fixed bottom-24 sm:bottom-6 right-6 sm:right-44 z-40 animate-fade-in">
          <button
            onClick={handleReturnToChamber}
            onMouseEnter={() => cyberAudio.playHoverBlip()}
            title="Return to 3D Workspace Chamber"
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d1629]/95 hover:bg-[#111e38] border border-cyan-500/35 hover:border-cyan-400 text-slate-200 hover:text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md text-xs font-semibold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>3D CHAMBER</span>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400/70 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};
