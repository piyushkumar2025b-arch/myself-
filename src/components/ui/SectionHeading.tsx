import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleId?: string;
  subtitleId?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  eyebrow,
  align = 'center',
  className = '',
  titleId,
  subtitleId,
}) => {
  const alignClasses = {
    left: 'text-left mr-auto',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  return (
    <div className={`max-w-3xl mb-12 sm:mb-16 ${alignClasses[align]} ${className}`}>
      {eyebrow && eyebrow.trim() !== '' && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 backdrop-blur-sm shadow-[0_0_12px_rgba(16,185,129,0.12)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{eyebrow}</span>
        </div>
      )}

      <h2
        id={titleId}
        className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] leading-[1.12] mb-4"
      >
        {title}
      </h2>

      {subtitle && subtitle.trim() !== '' && (
        <p
          id={subtitleId}
          className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
