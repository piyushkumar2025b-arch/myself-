import React from 'react';
import { ServiceCardItem } from '../types/portfolio';
import { Code2, Layout, Database, Zap, Cpu, Cloud, Smartphone, ShieldCheck } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';

interface ServicesSectionProps {
  title: string;
  subtitle: string;
  services: ServiceCardItem[];
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  title,
  subtitle,
  services,
}) => {
  const enabledServices = [...services]
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  const getServiceIcon = (iconType: string, color?: string) => {
    const iconClass = "w-5 h-5";
    switch (iconType) {
      case 'code':
        return <Code2 className={iconClass} style={{ color: color || '#38bdf8' }} />;
      case 'ui':
        return <Layout className={iconClass} style={{ color: color || '#c084fc' }} />;
      case 'database':
        return <Database className={iconClass} style={{ color: color || '#fb923c' }} />;
      case 'performance':
        return <Zap className={iconClass} style={{ color: color || '#4ade80' }} />;
      case 'ai':
        return <Cpu className={iconClass} style={{ color: color || '#f43f5e' }} />;
      case 'cloud':
        return <Cloud className={iconClass} style={{ color: color || '#38bdf8' }} />;
      case 'mobile':
        return <Smartphone className={iconClass} style={{ color: color || '#a855f7' }} />;
      case 'security':
        return <ShieldCheck className={iconClass} style={{ color: color || '#10b981' }} />;
      default:
        return <Code2 className={iconClass} style={{ color: color || '#38bdf8' }} />;
    }
  };

  // Dynamic grid column class based on enabled count
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  return (
    <section id="services" className="py-16 sm:py-24 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-600/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="services-section-heading"
            subtitleId="services-section-subtitle"
          />
        </Reveal>

        {/* Open, unboxed layout for services / focus areas */}
        <div className={`grid gap-8 sm:gap-10 md:gap-12 ${getGridCols(enabledServices.length)}`}>
          {enabledServices.map((service, index) => (
            <Reveal key={service.id} delay={index * 0.06} direction="up">
              <div
                id={`service-item-${service.id}`}
                className="group flex flex-col items-start space-y-3.5"
              >
                {/* Clean Icon */}
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-250 group-hover:scale-105"
                  style={{
                    backgroundColor: service.iconColor ? `${service.iconColor}14` : 'rgba(56, 189, 248, 0.1)'
                  }}
                >
                  {getServiceIcon(service.iconType, service.iconColor)}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
};
