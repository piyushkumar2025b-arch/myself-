import React from 'react';
import { SocialLink, NavItem, FooterSettings } from '../types/portfolio';
import { SocialButtons } from './SocialButtons';
import { ArrowUp, FileText, Database } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';

interface FooterProps {
  name: string;
  title: string;
  socialLinks: SocialLink[];
  navItems?: NavItem[];
  logoLetter?: string;
  footerSettings?: FooterSettings;
  onOpenDocuments?: () => void;
  onOpenDatabase?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  name,
  title,
  socialLinks,
  navItems = [],
  logoLetter = 'P',
  footerSettings,
  onOpenDocuments,
  onOpenDatabase,
}) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="relative pt-16 pb-12 border-t border-white/[0.08] overflow-hidden">
      {/* Top subtle glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#10141f] border border-emerald-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.2)]">
              <span className="font-extrabold text-sm text-emerald-400">{logoLetter}</span>
            </div>
            <div>
              <p className="font-bold text-base text-white">{name}</p>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>

          {/* Social Icons */}
          <SocialButtons socialLinks={socialLinks} size="sm" />

          {/* Actions: Documents & Back to top */}
          <div className="flex items-center gap-3">
            {onOpenDocuments && (
              <MagneticButton strength={2.5}>
                <button
                  onClick={onOpenDocuments}
                  id="footer-documents-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1017] hover:bg-[#141824] border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all duration-200"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Documents</span>
                </button>
              </MagneticButton>
            )}

            {/* Back to top button */}
            {(footerSettings?.showBackToTop ?? true) && (
              <MagneticButton strength={2.5}>
                <button
                  onClick={scrollToTop}
                  id="footer-back-to-top-btn"
                  aria-label="Back to top of page"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1017] hover:bg-[#141824] border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 group"
                >
                  <span>Back to Top</span>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </button>
              </MagneticButton>
            )}
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            {footerSettings?.copyrightText 
              ? footerSettings.copyrightText 
              : `© ${currentYear} ${name}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-3">
            {footerSettings?.statusText && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {footerSettings.statusText}
              </span>
            )}
            {onOpenDatabase && (
              <button
                onClick={onOpenDatabase}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors border border-emerald-500/20"
                title="View Database Architecture & Telemetry"
              >
                <Database className="w-3 h-3" />
                <span>Database Hub</span>
              </button>
            )}
            <p className="flex items-center gap-1.5">
              <span>Built with React, TypeScript & Tailwind CSS</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
