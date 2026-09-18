import React from 'react';
import { PersonalInfo, CTAButton, SocialLink, VisualSettings } from '../types/portfolio';
import { HeroVisual3D } from './HeroVisual3D';
import { SocialButtons } from './SocialButtons';
import { ArrowRight, Download, Mail, ExternalLink, FileText } from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton';
import { Reveal } from './ui/Reveal';

interface HeroProps {
  personal: PersonalInfo;
  heroButtons: {
    primary: CTAButton;
    secondary: CTAButton;
  };
  socialLinks: SocialLink[];
  visualSettings: VisualSettings;
  onUpdateProfileImage?: (url: string) => void;
  onOpenDocuments?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  personal,
  heroButtons,
  socialLinks,
  visualSettings,
  onUpdateProfileImage,
  onOpenDocuments,
}) => {
  const getButtonIcon = (iconType?: string) => {
    switch (iconType) {
      case 'arrow-right':
        return <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />;
      case 'download':
        return <Download className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />;
      case 'mail':
        return <Mail className="w-4 h-4" />;
      case 'external':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Only show secondary button (Download CV) if a valid real resumeUrl is configured
  const hasRealResume = Boolean(
    personal.resumeUrl && 
    personal.resumeUrl.trim() !== '' && 
    personal.resumeUrl.trim() !== '#'
  );

  return (
    <section 
      id="home" 
      className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32 overflow-hidden"
    >
      {/* Background ambient gradient glow accents */}
      <div className="absolute top-1/4 left-1/12 w-[520px] h-[520px] bg-emerald-500/[0.09] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/12 w-[520px] h-[520px] bg-purple-600/[0.08] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(16,242,150,0.08),transparent_70%)] pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
            
            {/* Availability Badge */}
            {personal.isAvailable && (
              <Reveal delay={0.05} direction="up">
                <div 
                  id="hero-availability-badge"
                  className="card-chiseled inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0c152a]/95 border border-emerald-400/40 text-emerald-400 text-xs sm:text-sm font-semibold mb-6 shadow-[0_0_24px_rgba(16,242,150,0.22)] backdrop-blur-xl group hover:border-emerald-300 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#10f296]"></span>
                  </span>
                  <span className="tracking-wide text-slate-200 group-hover:text-white transition-colors">{personal.availabilityText}</span>
                </div>
              </Reveal>
            )}

            {/* Main Headline */}
            <Reveal delay={0.1} direction="up">
              <h1 
                id="hero-headline"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] text-white mb-4 leading-[1.06]"
              >
                Hi, I'm <br className="hidden sm:inline" />
                <span className="text-gradient-name-first">
                  {personal.firstName}
                </span>{' '}
                <span className="text-gradient-name-last">
                  {personal.lastName}
                </span>
              </h1>
            </Reveal>

            {/* Professional Title */}
            <Reveal delay={0.15} direction="up">
              <h2 
                id="hero-professional-title"
                className="text-xl sm:text-2xl font-bold text-slate-200 tracking-[-0.02em] mb-4"
              >
                {personal.title}
              </h2>
            </Reveal>

            {/* Short Editorial Description (constrained to ~620px) */}
            <Reveal delay={0.2} direction="up">
              <p 
                id="hero-description"
                className="text-base sm:text-lg text-slate-300/90 max-w-[620px] font-normal leading-relaxed mb-9 tracking-normal"
              >
                {personal.shortDescription}
              </p>
            </Reveal>

            {/* CTA Action Buttons */}
            <Reveal delay={0.25} direction="up">
              <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
                {/* Primary CTA (Contact Me ->) */}
                {heroButtons.primary.enabled && (
                  <MagneticButton strength={3.5}>
                    <a
                      id="hero-primary-cta"
                      href={heroButtons.primary.link || '#contact'}
                      className="portfolio-btn-primary group"
                    >
                      <span>{heroButtons.primary.text}</span>
                      {getButtonIcon(heroButtons.primary.icon)}
                    </a>
                  </MagneticButton>
                )}

                {/* Secondary CTA (Download CV ↓) - Only shown when real resumeUrl exists */}
                {hasRealResume && (
                  <MagneticButton strength={3.5}>
                    <a
                      id="hero-secondary-cta"
                      href={personal.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portfolio-btn-secondary group"
                    >
                      <span>{heroButtons.secondary.text || 'Download CV'}</span>
                      {getButtonIcon(heroButtons.secondary.icon || 'download')}
                    </a>
                  </MagneticButton>
                )}

                {/* Public Document Access Button */}
                {onOpenDocuments && (
                  <MagneticButton strength={3.5}>
                    <button
                      id="hero-documents-cta"
                      type="button"
                      onClick={onOpenDocuments}
                      className="portfolio-btn-secondary group flex items-center gap-2 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-200 hover:text-white"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Public Documents</span>
                    </button>
                  </MagneticButton>
                )}
              </div>
            </Reveal>

            {/* Circular Social Connections Row */}
            <Reveal delay={0.3} direction="up">
              <div className="w-full pt-1">
                <SocialButtons 
                  socialLinks={socialLinks} 
                  size="md" 
                  className="justify-start" 
                />
              </div>
            </Reveal>

          </div>

          {/* Right Hero Visual / 3D Profile Card */}
          {visualSettings.showProfileVisual && (
            <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
              <Reveal delay={0.2} direction="left">
                <HeroVisual3D
                  imageSrc={personal.profileImage}
                  altText={personal.name}
                  enable3D={visualSettings.enable3DEffects}
                  onImageChange={onUpdateProfileImage}
                />
              </Reveal>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
