import React from 'react';
import { ExperienceItem } from '../types/portfolio';
import { Calendar, MapPin } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { GlowCard } from './ui/GlowCard';
import { Reveal } from './ui/Reveal';

interface ExperienceSectionProps {
  title?: string;
  subtitle?: string;
  experiences: ExperienceItem[];
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  title = "Work Experience",
  subtitle = "Engineering robust applications and scalable systems across tech organizations.",
  experiences,
}) => {
  const enabledExp = [...experiences]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledExp.length === 0) return null;

  return (
    <section id="experience" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="experience-section-heading"
            subtitleId="experience-section-subtitle"
          />
        </Reveal>

        {/* Timeline Cards Container */}
        <div className="max-w-4xl mx-auto space-y-5">
          {enabledExp.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08} direction="up">
              <GlowCard
                id={`experience-item-${item.id}`}
                className="p-6 sm:p-8 rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {item.role}
                      </h3>
                      {item.isCurrent && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,242,150,0.25)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Present</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mt-1">
                      <span>{item.organization}</span>
                      {item.location && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 font-normal flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full bg-[#0c1222] border border-white/[0.08] shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.startDate} — {item.isCurrent ? 'Present' : item.endDate}</span>
                    {item.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10f296]" />
                    )}
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-2 mb-4">
                  {item.description.map((desc, i) => (
                    <li key={i} className="text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,242,150,0.4)]" />
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech tags */}
                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.06]">
                    {item.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0c1222] text-slate-300 border border-white/[0.08] hover:border-emerald-500/30 transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </GlowCard>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
};
