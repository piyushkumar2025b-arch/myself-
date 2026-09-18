import React from 'react';
import { AchievementItem } from '../types/portfolio';
import { Trophy, Calendar, ExternalLink } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { GlowCard } from './ui/GlowCard';
import { Reveal } from './ui/Reveal';
import { sanitizeUrl } from '../utils/security';

interface AchievementsSectionProps {
  title: string;
  subtitle: string;
  achievements: AchievementItem[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  title,
  subtitle,
  achievements,
}) => {
  const enabledItems = [...achievements]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledItems.length === 0) return null;

  return (
    <section id="achievements" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="achievements-section-heading"
            subtitleId="achievements-section-subtitle"
          />
        </Reveal>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {enabledItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08} direction="up">
              <GlowCard
                glowColor="rgba(245, 158, 11, 0.08)"
                borderGlowColor="rgba(245, 158, 11, 0.35)"
                className="p-6 rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                      <Trophy className="w-5 h-5" />
                    </div>
                    {item.date && (
                      <div className="text-xs text-slate-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c1222] border border-white/[0.08]">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{item.date}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 mb-2">
                    {item.issuer}
                  </p>

                  {item.description && (
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.url && (
                  <a
                    href={sanitizeUrl(item.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-400 font-semibold mt-4 pt-3 border-t border-white/[0.06] transition-colors"
                  >
                    <span>Verification Link</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </GlowCard>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
};
