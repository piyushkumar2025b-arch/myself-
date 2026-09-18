import React, { useState } from 'react';
import { SkillItem } from '../types/portfolio';
import { BrandIcon } from './BrandIcons';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';
import { Sparkles, Terminal, Cpu, Cloud, Wrench, ExternalLink } from 'lucide-react';

interface SkillCloudProps {
  title: string;
  subtitle: string;
  skills: SkillItem[];
}

export const SkillCloud: React.FC<SkillCloudProps> = ({
  title,
  subtitle,
  skills,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const enabledSkills = [...skills]
    .filter(skill => skill.enabled)
    .sort((a, b) => a.order - b.order);

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'languages':
        return 'Languages & Core';
      case 'workbenches':
        return 'Workbenches Explored [TRIED]';
      case 'ai':
        return 'AI Models & Agents';
      case 'devops':
        return 'Cloud & DevOps';
      case 'tools':
        return 'Tools & Workflows';
      default:
        return 'Other';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'languages':
        return <Terminal className="w-3.5 h-3.5" />;
      case 'workbenches':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'devops':
        return <Cloud className="w-3.5 h-3.5" />;
      case 'tools':
        return <Cpu className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const categories = ['all', 'languages', 'workbenches', 'ai', 'devops', 'tools'].filter(cat => 
    cat === 'all' || enabledSkills.some(s => s.category === cat)
  );

  const filteredSkills = activeCategory === 'all' 
    ? enabledSkills 
    : enabledSkills.filter(s => s.category === activeCategory);

  // Grouped for default 'all' view
  const languagesSkills = enabledSkills.filter(s => s.category === 'languages');
  const workbenchAiSkills = enabledSkills.filter(s => ['workbenches', 'ai', 'devops', 'tools'].includes(s.category || ''));

  const renderSkillChip = (skill: SkillItem, accentColor: 'emerald' | 'cyan' = 'emerald') => {
    const isCyan = accentColor === 'cyan';
    const borderHoverClass = isCyan ? 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.18)]' : 'hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,242,150,0.18)]';
    const textHoverClass = isCyan ? 'group-hover:text-cyan-300' : 'group-hover:text-emerald-300';
    const iconHoverClass = isCyan ? 'text-cyan-400' : 'text-emerald-400';

    if (skill.url) {
      return (
        <a
          key={skill.id}
          id={`skill-chip-${skill.id}`}
          href={skill.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Visit official ${skill.name} website (opens in new tab)`}
          aria-label={`Visit official ${skill.name} website`}
          className={`group card-chiseled relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#090e1c]/90 hover:bg-[#111930] border border-white/[0.08] ${borderHoverClass} transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer shadow-sm`}
        >
          <BrandIcon 
            name={skill.icon || skill.name} 
            size={18} 
            className="transition-transform duration-200 group-hover:scale-110 shrink-0" 
          />
          <span className={`text-sm font-medium text-slate-200 ${textHoverClass} transition-colors`}>
            {skill.name}
          </span>
          <ExternalLink className={`w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 ${iconHoverClass} transition-all duration-200 -ml-0.5`} />
        </a>
      );
    }

    return (
      <div
        key={skill.id}
        id={`skill-chip-${skill.id}`}
        className="group card-chiseled relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#090e1c]/90 hover:bg-[#111930] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5 cursor-default select-none shadow-sm"
      >
        <BrandIcon 
          name={skill.icon || skill.name} 
          size={18} 
          className="transition-transform duration-200 group-hover:scale-110 shrink-0" 
        />
        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
          {skill.name}
        </span>
      </div>
    );
  };

  return (
    <section id="skills" className="py-16 sm:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="skills-section-heading"
            subtitleId="skills-section-subtitle"
          />
        </Reveal>

        {/* Category Filter Pills */}
        <Reveal delay={0.1} direction="up">
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-[#070b16]/80 border border-white/[0.08] backdrop-blur-xl mb-12 max-w-fit mx-auto shadow-inner shadow-black/30">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-[0_0_14px_rgba(16,242,150,0.22)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat !== 'all' && getCategoryIcon(cat)}
                <span className="whitespace-nowrap">
                  {cat === 'all' ? 'All Technologies' : getCategoryLabel(cat)}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {activeCategory === 'all' ? (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Core Languages */}
            {languagesSkills.length > 0 && (
              <Reveal delay={0.15} direction="up">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 justify-center">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Languages & Foundations</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                    {languagesSkills.map((skill) => renderSkillChip(skill, 'emerald'))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Workbenches Explored [TRIED] & AI */}
            {workbenchAiSkills.length > 0 && (
              <Reveal delay={0.2} direction="up">
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Workbenches Explored [TRIED] & AI Ecosystem</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                    {workbenchAiSkills.map((skill) => renderSkillChip(skill, 'cyan'))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        ) : (
          /* Filtered View */
          <Reveal delay={0.15} direction="up">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-5xl mx-auto">
              {filteredSkills.map((skill) => renderSkillChip(skill, activeCategory === 'languages' ? 'emerald' : 'cyan'))}
            </div>
          </Reveal>
        )}

      </div>
    </section>
  );
};

