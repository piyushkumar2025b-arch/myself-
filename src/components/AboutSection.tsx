import React from 'react';
import { PersonalInfo } from '../types/portfolio';
import { 
  GraduationCap, 
  MapPin, 
  Dumbbell, 
  Briefcase, 
  ArrowRight,
  Code2,
  Globe2,
  Heart,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';
import { MagneticButton } from './ui/MagneticButton';

interface AboutSectionProps {
  personal: PersonalInfo;
  title?: string;
  subtitle?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  personal,
  title = "About Me",
  subtitle = "A little about my background, studies, and what I do outside of coding."
}) => {
  const collegeName = personal.college || "Vellore Institute of Technology (VIT), Chennai";
  const degreeTitle = personal.degree || "B.Tech — CSE (Computer Science & Engineering) Core";
  const semesterText = personal.semester || "Semester 3 (2nd Year)";
  const city = personal.city || "Chennai";
  const state = personal.state || "Tamil Nadu";
  const locationText = personal.location || `${city}, ${state}, India`;
  const vitChennaiMapsUrl = "https://maps.google.com/?q=Vellore+Institute+of+Technology+VIT+Chennai+Campus+Vandalur+Kelambakkam+Road+Chennai+Tamil+Nadu";
  
  const professionalSkills = personal.professionalAt && personal.professionalAt.length > 0
    ? personal.professionalAt
    : [
        "Fullstack Web Architecture",
        "AI & Machine Learning Systems",
        "Modern Frontend & Interactive UI",
        "Scalable APIs & Cloud Deployment"
      ];

  const hobbiesList = personal.hobbies && personal.hobbies.length > 0
    ? personal.hobbies
    : [
        "Fitness & Strength Training",
        "Tech Innovation & Open Source",
        "Competitive Programming",
        "Algorithm Design & Problem Solving"
      ];

  const heroQuoteText = personal.aboutIntro || "I like building technologies and fitness. Are you ready to join? Then let's come and build something!";

  return (
    <section id="about" className="py-16 sm:py-24 relative">
      {/* Soft ambient background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/[0.025] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="about-section-heading"
            subtitleId="about-section-subtitle"
          />
        </Reveal>

        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          
          {/* 1. Hero Statement & Story - Clean, Open Layout Without Heavy Box Enclosures */}
          <Reveal delay={0.1} direction="up">
            <div className="card-chiseled relative p-8 sm:p-10 rounded-2xl sm:rounded-3xl bg-[#0a0f1d]/90 border border-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4 max-w-3xl">
                  <blockquote className="text-xl sm:text-2xl md:text-[25px] font-bold text-white tracking-[-0.025em] leading-snug">
                    "{heroQuoteText}"
                  </blockquote>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {personal.longDescription || personal.shortDescription}
                  </p>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <MagneticButton strength={3}>
                    <a
                      href="#contact"
                      className="portfolio-btn-primary w-full md:w-auto !py-3 !px-7 !text-xs !rounded-full shadow-[0_0_24px_rgba(255,255,255,0.22)] flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Get in Touch</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 2. Content Grid - Unboxed, clean typography with natural hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 pt-2">
            
            {/* Left Column: Studies, Location & Focus */}
            <Reveal delay={0.15} direction="up">
              <div className="space-y-8">
                
                {/* College & Education */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-cyan-400">
                    <GraduationCap className="w-5 h-5" />
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      College & Education
                    </h3>
                  </div>

                  <div className="space-y-2 pl-7 border-l border-white/[0.08]">
                    <div>
                      <a 
                        href={vitChennaiMapsUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base sm:text-lg font-semibold text-slate-100 hover:text-cyan-300 transition-colors inline-flex items-center gap-2 group"
                      >
                        <span>{collegeName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                    
                    <p className="text-sm text-slate-300 font-medium">
                      Program: <span className="text-white">{degreeTitle}</span>
                    </p>

                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Currently: {semesterText}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{city}, {state}</span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Globe2 className="w-3 h-3 text-cyan-400" />
                        India
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Interests / Focus Areas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Briefcase className="w-5 h-5" />
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      What I Focus On
                    </h3>
                  </div>

                  <ul className="space-y-2.5 pl-7 border-l border-white/[0.08]">
                    {professionalSkills.map((skill, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </Reveal>

            {/* Right Column: Hobbies & Personal Interests */}
            <Reveal delay={0.2} direction="up">
              <div className="space-y-8">
                
                {/* Hobbies & Lifestyle */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Dumbbell className="w-5 h-5" />
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Hobbies & Lifestyle
                    </h3>
                  </div>

                  <ul className="space-y-3 pl-7 border-l border-white/[0.08]">
                    {hobbiesList.map((hobby, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                        <div className="mt-1 text-amber-400 shrink-0">
                          {idx === 0 ? (
                            <Dumbbell className="w-4 h-4" />
                          ) : idx === 1 ? (
                            <Code2 className="w-4 h-4" />
                          ) : idx === 2 ? (
                            <Terminal className="w-4 h-4" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-medium text-slate-200 leading-snug">
                          {hobby}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brief Human Note */}
                <div className="pl-7 border-l border-emerald-500/20 pt-1">
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic">
                    "Staying active and disciplined in fitness gives me the mental energy and persistence needed to build great software."
                  </p>
                </div>

              </div>
            </Reveal>

          </div>

        </div>

      </div>
    </section>
  );
};

