import React from 'react';
import { EducationItem } from '../types/portfolio';
import { GraduationCap, Calendar, ExternalLink } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { GlowCard } from './ui/GlowCard';
import { Reveal } from './ui/Reveal';

interface EducationSectionProps {
  title: string;
  subtitle: string;
  education: EducationItem[];
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  title,
  subtitle,
  education,
}) => {
  const enabledItems = [...education]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledItems.length === 0) return null;

  return (
    <section id="education" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="education-section-heading"
            subtitleId="education-section-subtitle"
          />
        </Reveal>

        <div className="max-w-4xl mx-auto space-y-4">
          {enabledItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08} direction="up">
              <GlowCard
                className="p-6 sm:p-7 rounded-2xl bg-[#0c1017]/95 border border-white/[0.08] hover:border-white/[0.18] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {item.degree} in {item.field}
                      </h3>
                      <p className="text-sm font-semibold text-slate-300">
                        {item.institution}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 sm:self-start px-3 py-1 rounded-full bg-[#121624] border border-white/[0.06] shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.startDate} — {item.endDate}</span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold mt-4 pt-3 border-t border-white/[0.06]"
                  >
                    <span>Institution Website</span>
                    <ExternalLink className="w-3 h-3" />
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
