import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface BackToTopProps {
  threshold?: number;
  className?: string;
}

export const BackToTop: React.FC<BackToTopProps> = ({
  threshold = 350,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    const portfolioTrack = document.getElementById('intro-scroll-track');
    const trackHeight = portfolioTrack ? portfolioTrack.offsetHeight : window.innerHeight * 1.4;

    // If user is scrolled down inside the portfolio, scroll back to portfolio hero (#home)
    if (window.scrollY > trackHeight + 80) {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        homeSection.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
        return;
      }
      window.scrollTo({
        top: trackHeight + 40,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
      return;
    }

    // If already at the top of the portfolio, scroll to the 3D chamber
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          id="global-back-to-top-btn"
          aria-label="Scroll to top of page"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className={`fixed bottom-6 left-6 z-40 p-3 rounded-full bg-[#0e121a]/90 hover:bg-[#161c28] border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-md transition-all duration-200 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f] ${className}`}
        >
          <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
