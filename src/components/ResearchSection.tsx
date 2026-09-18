import React from 'react';
import { ResearchItem } from '../types/portfolio';
import { BookOpen, Calendar, ExternalLink, FileText } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { GlowCard } from './ui/GlowCard';
import { Reveal } from './ui/Reveal';
import { sanitizeUrl } from '../utils/security';

interface ResearchSectionProps {
  title: string;
  subtitle: string;
  research: ResearchItem[];
}

export const ResearchSection: React.FC<ResearchSectionProps> = ({
  title,
  subtitle,
  research,
}) => {
  const enabledItems = [...research]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledItems.length === 0) return null;

  return (
    <section id="research" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="research-section-heading"
            subtitleId="research-section-subtitle"
          />
        </Reveal>

        <div className="max-w-4xl mx-auto space-y-4">
          {enabledItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08} direction="up">
              <GlowCard
                glowColor="rgba(6, 182, 212, 0.08)"
                borderGlowColor="rgba(6, 182, 212, 0.35)"
                className="p-6 sm:p-7 rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {item.title}
                      </h3>
                      {item.venue && (
                        <p className="text-sm font-semibold text-slate-300">
                          {item.venue}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.date && (
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 sm:self-start px-3 py-1 rounded-full bg-[#0c1222] border border-white/[0.08] shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.date}</span>
                    </div>
                  )}
                </div>

                {item.authors && (
                  <p className="text-xs text-slate-400 mt-1.5 italic">
                    Authors: {item.authors}
                  </p>
                )}

                {item.description && (
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
                  {item.url && (
                    <a
                      href={sanitizeUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <span>View Publication</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.pdfUrl && (
                    <a
                      href={sanitizeUrl(item.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-semibold"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Download PDF</span>
                    </a>
                  )}
                  {item.doi && (
                    <span className="text-xs text-slate-500">
                      DOI: {item.doi}
                    </span>
                  )}
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
};
