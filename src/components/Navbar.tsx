import React, { useState, useEffect } from 'react';
import { NavItem, CTAButton } from '../types/portfolio';
import { Moon, Sun, Menu, X, ArrowUpRight, FileText, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticButton } from './ui/MagneticButton';

interface NavbarProps {
  navItems: NavItem[];
  contactButton?: CTAButton;
  logoLetter?: string;
  activeSection?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenCustomizer?: () => void;
  onOpenDocuments?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems,
  contactButton,
  logoLetter = 'P',
  activeSection = 'home',
  isDarkMode = true,
  onToggleTheme,
  onOpenCustomizer,
  onOpenDocuments,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const enabledNav = [...navItems]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const isDark = document.documentElement.classList.toggle('dark');
      if (!isDark) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-2.5 sm:py-3 bg-[#040711]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/50'
          : 'py-4 sm:py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo - Stylized neon mark */}
          <MagneticButton strength={2.5}>
            <a
              href="#home"
              id="brand-logo"
              className="flex items-center gap-2.5 group transition-transform duration-300"
              aria-label="Home"
            >
              <div className="relative w-9 h-9 rounded-full bg-[#0a0f1d] border border-emerald-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(16,242,150,0.22)] group-hover:border-emerald-400 group-hover:shadow-[0_0_24px_rgba(16,242,150,0.45)] transition-all duration-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <circle cx="12" cy="8" r="3.5" stroke="#10f296" strokeWidth="2.2" fill="#060913" />
                  <path d="M8.5 8V18" stroke="#10f296" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="1.2" fill="#00f0ff" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                {logoLetter}
              </span>
            </a>
          </MagneticButton>

          {/* Desktop Navigation Floating Pill */}
          <nav className="hidden md:flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#070b16]/80 backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {enabledNav.map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <a
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  href={item.href}
                  className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 -z-10 shadow-[0_0_14px_rgba(16,242,150,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right actions: Contact CTA & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Public Document Access Button */}
            {onOpenDocuments && (
              <MagneticButton strength={2.5}>
                <button
                  id="navbar-documents-btn"
                  onClick={onOpenDocuments}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_14px_rgba(16,242,150,0.15)] transition-all duration-300 active:scale-95"
                  title="Open Public Document Access & Downloads"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Documents</span>
                </button>
              </MagneticButton>
            )}

            {/* Platform Editor / Admin Quick Access */}
            {onOpenCustomizer && (
              <MagneticButton strength={2.5}>
                <button
                  id="navbar-admin-editor-btn"
                  onClick={onOpenCustomizer}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_18px_rgba(16,242,150,0.35)] transition-all duration-300 active:scale-95 cursor-pointer"
                  title="Open Platform Editors & Admin Controller"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </button>
              </MagneticButton>
            )}

            {/* Primary Action Button (White Pill in Reference) */}
            {contactButton && contactButton.enabled && (
              <MagneticButton strength={3}>
                <a
                  id="navbar-contact-cta"
                  href={contactButton.link || '#contact'}
                  className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-full bg-white text-slate-950 hover:bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.22)] hover:shadow-[0_0_28px_rgba(255,255,255,0.38)] transition-all duration-300 active:scale-95"
                >
                  <span>{contactButton.text}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-700" />
                </a>
              </MagneticButton>
            )}

            {/* Dark/Light mode toggle icon */}
            <button
              id="theme-toggle-btn"
              onClick={handleToggle}
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
              className="p-2.5 rounded-full text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] dark:hover:bg-white/[0.08] light:hover:bg-slate-900/[0.06] border border-white/[0.08] light:border-slate-900/[0.08] transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-slate-300 transition-transform duration-300 hover:rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 hover:rotate-45" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-4 p-4 rounded-2xl bg-[#0c1017]/95 border border-white/10 shadow-2xl backdrop-blur-2xl"
          >
            <nav className="flex flex-col gap-1.5">
              {enabledNav.map((item) => {
                const isActive = activeSection === item.href.replace('#', '');
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 text-base font-medium rounded-xl transition-colors ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10 font-semibold border border-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              
              {onOpenDocuments && (
                <button
                  id="mobile-documents-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDocuments();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-base font-semibold rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Public Documents & Vault</span>
                </button>
              )}

              {onOpenCustomizer && (
                <button
                  id="mobile-admin-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCustomizer();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-base font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Edit Platform & Content</span>
                </button>
              )}

              {contactButton && contactButton.enabled && (
                <a
                  href={contactButton.link || '#contact'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 text-center px-4 py-2.5 text-base font-semibold rounded-xl bg-white text-slate-950 hover:bg-slate-100 shadow-md transition-colors"
                >
                  {contactButton.text}
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
