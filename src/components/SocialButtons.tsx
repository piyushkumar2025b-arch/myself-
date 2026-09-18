import React from 'react';
import { SocialLink } from '../types/portfolio';
import { BrandIcon } from './BrandIcons';
import { MagneticButton } from './ui/MagneticButton';
import { sanitizeUrl } from '../utils/security';

interface SocialButtonsProps {
  socialLinks: SocialLink[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ 
  socialLinks, 
  className = "",
  size = 'md'
}) => {
  const enabledLinks = [...socialLinks]
    .filter(link => link.enabled)
    .sort((a, b) => a.order - b.order);

  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-13 h-13"
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {enabledLinks.map((item) => (
        <MagneticButton key={item.id} strength={2.5}>
          <a
            id={item.id}
            href={sanitizeUrl(item.url)}
            target={item.platform === 'gmail' || item.url.startsWith('mailto:') ? '_self' : '_blank'}
            rel={item.platform === 'gmail' || item.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            aria-label={item.ariaLabel || item.name}
            title={item.tooltip || item.name}
            className={`group relative flex items-center justify-center rounded-full bg-[#080d1a] border border-white/[0.1] hover:border-emerald-500/40 text-slate-300 hover:text-white shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(16,242,150,0.3)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${sizeClasses[size]}`}
          >
            {/* Subtle inner radial highlight on hover */}
            <span className="absolute inset-0 rounded-full bg-radial-highlight opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-tr from-emerald-500/15 via-cyan-500/10 to-purple-500/15" />
            
            <BrandIcon 
              name={item.platform} 
              size={iconSizes[size]} 
              className="transition-transform duration-300 group-hover:scale-115 relative z-10 text-slate-300 group-hover:text-emerald-400" 
            />
          </a>
        </MagneticButton>
      ))}
    </div>
  );
};
