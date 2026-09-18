import React from 'react';
import { SectionHeaders } from '../../types/portfolio';
import { Heading, RotateCcw } from 'lucide-react';

interface AdminSectionHeadersManagerProps {
  sectionHeaders: SectionHeaders;
  onChange: (headers: SectionHeaders) => void;
}

interface SectionItemDef {
  key: string;
  name: string;
  titleKey: keyof SectionHeaders;
  subtitleKey: keyof SectionHeaders;
  defaultTitle: string;
  defaultSubtitle: string;
}

const SECTIONS: SectionItemDef[] = [
  {
    key: 'about',
    name: 'About Section',
    titleKey: 'aboutTitle',
    subtitleKey: 'aboutSubtitle',
    defaultTitle: 'About Me',
    defaultSubtitle: 'Academic journey, developer mindset, and personal vision.',
  },
  {
    key: 'skills',
    name: 'Skills & Tech Stack Section',
    titleKey: 'skillsTitle',
    subtitleKey: 'skillsSubtitle',
    defaultTitle: 'Skills & Tech Stack',
    defaultSubtitle: 'Languages, frameworks, developer tools, and explored platforms.',
  },
  {
    key: 'services',
    name: 'Services & Capabilities Section',
    titleKey: 'servicesTitle',
    subtitleKey: 'servicesSubtitle',
    defaultTitle: 'What I Build & Deliver',
    defaultSubtitle: 'Specialized capabilities across AI, full-stack systems, and product engineering.',
  },
  {
    key: 'projects',
    name: 'Featured Projects Section',
    titleKey: 'projectsTitle',
    subtitleKey: 'projectsSubtitle',
    defaultTitle: 'Featured Projects',
    defaultSubtitle: 'Explore real-world software engineering, machine learning pipelines, and verified deployments.',
  },
  {
    key: 'experience',
    name: 'Work Experience Section',
    titleKey: 'experienceTitle',
    subtitleKey: 'experienceSubtitle',
    defaultTitle: 'Experience',
    defaultSubtitle: 'Internships, industry engagements, and professional contributions.',
  },
  {
    key: 'education',
    name: 'Education Section',
    titleKey: 'educationTitle',
    subtitleKey: 'educationSubtitle',
    defaultTitle: 'Education',
    defaultSubtitle: 'Academic curriculum, university foundations, and qualifications.',
  },
  {
    key: 'research',
    name: 'Research & Publications Section',
    titleKey: 'researchTitle',
    subtitleKey: 'researchSubtitle',
    defaultTitle: 'Research & Publications',
    defaultSubtitle: 'Academic contributions, papers, and exploration of modern AI systems.',
  },
  {
    key: 'achievements',
    name: 'Achievements & Honors Section',
    titleKey: 'achievementsTitle',
    subtitleKey: 'achievementsSubtitle',
    defaultTitle: 'Honors & Achievements',
    defaultSubtitle: 'Recognitions, competitive rankings, and notable milestones.',
  },
  {
    key: 'contact',
    name: 'Contact & Collaboration Section',
    titleKey: 'contactTitle',
    subtitleKey: 'contactSubtitle',
    defaultTitle: 'Get In Touch',
    defaultSubtitle: 'Have a project in mind, an opportunity, or want to connect? Send a message directly.',
  },
];

export const AdminSectionHeadersManager: React.FC<AdminSectionHeadersManagerProps> = ({
  sectionHeaders,
  onChange,
}) => {
  const handleFieldChange = (key: keyof SectionHeaders, val: string) => {
    onChange({
      ...sectionHeaders,
      [key]: val,
    });
  };

  const handleResetSection = (sec: SectionItemDef) => {
    onChange({
      ...sectionHeaders,
      [sec.titleKey]: sec.defaultTitle,
      [sec.subtitleKey]: sec.defaultSubtitle,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Section Titles & Subtitles</h3>
        <p className="text-xs text-slate-400">
          Customize the prominent heading and descriptive subtitle displayed at the top of every section on the website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((sec) => (
          <div key={sec.key} className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heading className="w-3.5 h-3.5" />
                <span>{sec.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => handleResetSection(sec)}
                className="text-[10px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5"
                title="Reset to default"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Heading Title</label>
              <input
                type="text"
                value={sectionHeaders[sec.titleKey] || ''}
                onChange={(e) => handleFieldChange(sec.titleKey, e.target.value)}
                placeholder={sec.defaultTitle}
                className="w-full px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subtitle / Description</label>
              <textarea
                rows={2}
                value={sectionHeaders[sec.subtitleKey] || ''}
                onChange={(e) => handleFieldChange(sec.subtitleKey, e.target.value)}
                placeholder={sec.defaultSubtitle}
                className="w-full px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
