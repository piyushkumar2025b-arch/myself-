import React, { useState, useEffect } from 'react';
import { Workstation3DScene, CameraPreset, WORKSTATION_LIGHT_MOODS } from './Workstation3DScene';
import { cyberAudio } from '../../utils/cyberAudio';
import { 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ChevronDown,
  RotateCw,
  Camera
} from 'lucide-react';

interface CinematicLandingPageProps {
  onEnterPortfolio: (targetSectionId?: string) => void;
  scrollProgress: number; // 0 to 1
  isEntered: boolean;
}

interface MoodThemeTokens {
  bgColor: string;
  vignette: string;
  accentColor: string;
  accentBorder: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
}

const MOOD_THEMES: Record<number, MoodThemeTokens> = {
  0: { // Daylight Studio
    bgColor: '#091322',
    vignette: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(12, 24, 44, 0.45) 75%, #091322 100%)',
    accentColor: '#38bdf8',
    accentBorder: 'border-sky-400/40',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
    cardBg: 'bg-[#0c182e]/95',
  },
  1: { // Cyber Midnight Focus
    bgColor: '#040714',
    vignette: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(6, 12, 28, 0.5) 75%, #040714 100%)',
    accentColor: '#06b6d4',
    accentBorder: 'border-cyan-400/50',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    cardBg: 'bg-[#091326]/95',
  },
  2: { // Golden Hour Sunset
    bgColor: '#140803',
    vignette: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(32, 14, 6, 0.55) 75%, #140803 100%)',
    accentColor: '#f59e0b',
    accentBorder: 'border-amber-400/50',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    cardBg: 'bg-[#1a0c06]/95',
  },
  3: { // Neon Cyberpunk Matrix
    bgColor: '#0e0318',
    vignette: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(24, 6, 38, 0.55) 75%, #0e0318 100%)',
    accentColor: '#d946ef',
    accentBorder: 'border-fuchsia-400/50',
    glowColor: 'rgba(217, 70, 239, 0.45)',
    badgeBg: 'bg-fuchsia-500/15',
    badgeText: 'text-fuchsia-300',
    cardBg: 'bg-[#170526]/95',
  },
};

const CAMERA_PRESETS: { id: CameraPreset; label: string; icon: string }[] = [
  { id: 'overview', label: 'Studio Room', icon: '🌐' },
  { id: 'workstation', label: 'Desk Setup', icon: '🖥️' },
  { id: 'developer', label: 'Developer', icon: '🧑‍💻' },
  { id: 'cat', label: 'Cozy Cat', icon: '🐱' },
  { id: 'drone', label: 'Cyber Drone', icon: '🛸' },
];

export const CinematicLandingPage: React.FC<CinematicLandingPageProps> = ({
  onEnterPortfolio,
  scrollProgress,
  isEntered,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoRotate360, setIsAutoRotate360] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [activeMoodIndex, setActiveMoodIndex] = useState<number>(1); // Default to Cyber Midnight Focus
  const [showAngleMenu, setShowAngleMenu] = useState<boolean>(false);

  const currentTheme = MOOD_THEMES[activeMoodIndex] || MOOD_THEMES[1];

  // 360° Auto-Rotate tour toggle
  const toggle360Rotate = () => {
    setIsAutoRotate360((prev) => {
      const next = !prev;
      if (next) {
        cyberAudio.playClickConfirm();
      } else {
        cyberAudio.playHoverBlip();
      }
      return next;
    });
  };

  // Audio mute toggle
  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    cyberAudio.isMuted = nextMuted;
    if (!nextMuted) {
      cyberAudio.playClickConfirm();
    }
  };

  const handleEnterClick = (sectionId: string = 'home') => {
    cyberAudio.playEnterTransition();
    onEnterPortfolio(sectionId);
  };

  const handleMoodSelect = (moodId: number) => {
    cyberAudio.playHoverBlip();
    setActiveMoodIndex(moodId);
  };

  const handlePresetSelect = (preset: CameraPreset) => {
    cyberAudio.playHoverBlip();
    setActivePreset(preset);
    setShowAngleMenu(false);
  };

  // Keyboard navigation shortcuts (Space to enter, M to mute, 1-4 for moods)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEntered || scrollProgress >= 0.7) return;

      // Check if user is typing into any input field
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleEnterClick('home');
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === '1') {
        handleMoodSelect(0);
      } else if (e.key === '2') {
        handleMoodSelect(1);
      } else if (e.key === '3') {
        handleMoodSelect(2);
      } else if (e.key === '4') {
        handleMoodSelect(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEntered, scrollProgress]);

  // UI stays fully legible at the top, then gracefully fades as scroll approaches 0.4
  const uiOpacity = Math.max(0, 1 - scrollProgress * 2.4);
  const uiTransformY = -scrollProgress * 50;

  return (
    <div
      className={`fixed inset-0 w-full h-full select-none overflow-hidden transition-colors duration-700 ${
        isEntered ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{
        zIndex: isEntered ? 5 : 50,
        backgroundColor: currentTheme.bgColor,
        display: isEntered || scrollProgress >= 0.88 ? 'none' : 'block',
      }}
    >
      {/* 1. Real 3D Three.js WebGL Workstation Scene with live lighting mood */}
      <Workstation3DScene
        scrollProgress={scrollProgress}
        isEntered={isEntered}
        activePreset={activePreset}
        isAutoRotate360={isAutoRotate360}
        lightingMoodIndex={activeMoodIndex}
        onLightingMoodChange={setActiveMoodIndex}
      />

      {/* 2. Soft Ambient Vignette for cinematic focus, tinted to active lighting mood */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-all duration-700"
        style={{
          background: currentTheme.vignette,
          opacity: 1 - scrollProgress * 0.7,
        }}
      />

      {/* 3. High-End Restrained Cinematic UI Overlay */}
      <div
        className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 z-20 transition-all duration-300 pointer-events-none"
        style={{
          opacity: uiOpacity,
          transform: `translateY(${uiTransformY}px)`,
          display: scrollProgress > 0.85 && isEntered ? 'none' : 'flex',
        }}
      >
        {/* Top Minimalist Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between pointer-events-none gap-3">
          {/* Monogram and Piyush Kumar on Left Side */}
          <div 
            onClick={() => handleEnterClick('home')}
            className="group flex items-center gap-3 cursor-pointer pointer-events-auto"
          >
            <div 
              className={`relative w-10 h-10 rounded-xl ${currentTheme.cardBg} border ${currentTheme.accentBorder} flex items-center justify-center transition-all duration-300 shadow-xl shadow-black/80 backdrop-blur-xl group-hover:scale-105`}
              style={{ boxShadow: `0 0 20px ${currentTheme.glowColor}` }}
            >
              <span className={`font-black text-sm tracking-wider text-white transition-colors`}>
                PK
              </span>
              <span 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse border-2 border-black" 
                style={{ backgroundColor: currentTheme.accentColor }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 group-hover:text-white uppercase">
                  Piyush Kumar
                </span>
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.accentBorder}`}>
                  3D SPATIAL STUDIO
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:block tracking-wide">
                Staff Software Architect & AI Engineer
              </span>
            </div>
          </div>

          {/* Controls Cluster: Lighting Atmosphere Switcher + Camera Angles + 360 + Sound + Enter */}
          <nav className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto flex-wrap justify-end">
            
            {/* Lighting Atmosphere Selector (Sun, Moon, Sunset, Neon) */}
            <div className="flex items-center p-0.5 rounded-full bg-[#0d1629]/92 border border-white/[0.12] backdrop-blur-xl shadow-lg">
              {WORKSTATION_LIGHT_MOODS.map((mood) => {
                const isSelected = activeMoodIndex === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    title={`Lighting Mood: ${mood.name}`}
                    className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white/20 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{mood.icon}</span>
                    <span className="hidden xl:inline text-[11px]">{mood.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Camera Angle Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  cyberAudio.playHoverBlip();
                  setShowAngleMenu(!showAngleMenu);
                }}
                title="Select Cinematic Camera Perspective"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer backdrop-blur-xl active:scale-95 bg-[#0d1629]/92 border border-white/[0.12] text-slate-200 hover:text-white hover:border-white/30 shadow-lg`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">{CAMERA_PRESETS.find(p => p.id === activePreset)?.label || 'Vantage'}</span>
              </button>

              {showAngleMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#091122]/98 border border-white/[0.16] shadow-2xl p-1.5 z-40 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-white/[0.08] mb-1">
                    Camera Vantage
                  </div>
                  {CAMERA_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        activePreset === preset.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 360° Orbit View Toggle */}
            <button
              onClick={toggle360Rotate}
              title={isAutoRotate360 ? 'Pause 360° Orbit' : '360° View (Click to Rotate / Drag Scene)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer backdrop-blur-xl active:scale-95 ${
                isAutoRotate360
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'bg-[#0d1629]/92 border border-white/[0.12] text-slate-200 hover:text-cyan-300 hover:border-cyan-400/70 shadow-lg'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isAutoRotate360 ? 'animate-spin' : ''}`} style={isAutoRotate360 ? { animationDuration: '8s' } : undefined} />
              <span className="hidden sm:inline">360°</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
              className="w-9 h-9 rounded-full bg-[#0d1629]/92 border border-white/[0.12] text-slate-200 hover:text-cyan-400 hover:border-cyan-400/70 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-xl active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Quick Direct Enter Button */}
            <button
              onClick={() => handleEnterClick('home')}
              onMouseEnter={() => cyberAudio.playHoverBlip()}
              className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300 text-xs font-semibold text-white transition-all duration-200 cursor-pointer backdrop-blur-md active:scale-95 shadow-[0_0_18px_rgba(6,182,212,0.25)]"
            >
              <span>Enter</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </nav>
        </header>

        {/* Bottom Hero / Enter Section with Reality vs Present teaser */}
        <footer className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center pointer-events-none pb-6 sm:pb-8 mt-auto gap-3">
          
          {/* Main Enter Button */}
          <button
            id="go-to-portfolio-btn"
            type="button"
            onClick={() => handleEnterClick('home')}
            onMouseEnter={() => cyberAudio.playHoverBlip()}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#0d1629]/95 via-[#101e38]/95 to-[#0d1629]/95 hover:from-[#11213d] hover:to-[#11213d] border border-cyan-400/50 hover:border-cyan-300 text-white shadow-[0_0_35px_rgba(6,182,212,0.30)] hover:shadow-[0_0_45px_rgba(6,182,212,0.50)] backdrop-blur-2xl transition-all duration-300 cursor-pointer active:scale-95 select-none pointer-events-auto"
            aria-label="Enter Portfolio Website"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <span className="text-sm sm:text-base font-bold tracking-wide">
              Enter Portfolio Website
            </span>
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-200">
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:text-slate-950 transition-colors animate-bounce" />
            </div>
          </button>
        </footer>
      </div>

      {/* 4. Smooth Cyberspace Flash when passing through monitor at end of scroll */}
      {scrollProgress > 0.78 && (
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          style={{
            opacity: Math.min(1, (scrollProgress - 0.78) * 3.5),
            background: `radial-gradient(circle at 50% 50%, ${currentTheme.glowColor}, rgba(7, 13, 27, 0.95) 75%)`,
          }}
        />
      )}
    </div>
  );
};

