import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Moon,
  Sun,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Send,
  Settings,
  Key,
  ChevronDown,
  ArrowUpRight,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Snorlax3DCanvas } from './Snorlax3DCanvas';
import { SnorlaxAiService, ChatMessage, DEFAULT_MODELS } from '../../services/snorlaxAiService';
import { snorlaxAudio } from '../../utils/snorlaxAudio';

export const SnorlaxPetWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isMuted, setIsMuted] = useState(snorlaxAudio.getIsMuted());
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(SnorlaxAiService.getApiKey());
  const [selectedModel, setSelectedModel] = useState(SnorlaxAiService.getSelectedModel());
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(
    'Zzz... Click me to chat about Piyush\'s work! ⚡'
  );
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [berryCount, setBerryCount] = useState(3);
  const [isBerryEating, setIsBerryEating] = useState(false);
  const [isGigantamax, setIsGigantamax] = useState(false);
  const [isSleepAsmrActive, setIsSleepAsmrActive] = useState(false);
  const totalBerriesEatenRef = useRef(0);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'snorlax',
      text: '*Yaaawn... stretches chubby arms* 🐾 Hey there! I\'m Snorlax, Piyush\'s 3D companion! I can answer questions about his Full-Stack & AI projects, skills, 3D graphics lab, or help you get in touch! What would you like to explore? 🍓',
      timestamp: Date.now(),
      action: {
        type: 'scroll',
        target: 'projects',
        label: 'Explore Projects 🚀',
      },
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bug #1 Fix: Robust DOM-based scroll check to eliminate 70% UX trap on fast scrolls
  useEffect(() => {
    const checkScroll = () => {
      if (typeof window === 'undefined') return;
      const portfolioContent =
        document.getElementById('about') ||
        document.getElementById('projects') ||
        document.querySelector('main') ||
        document.getElementById('experience');

      if (portfolioContent) {
        const rect = portfolioContent.getBoundingClientRect();
        // Visible when portfolio content starts appearing near or inside viewport
        setIsInPortfolio(rect.top < window.innerHeight * 1.15);
      } else {
        setIsInPortfolio(window.scrollY > 250);
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Bug #7 Fix: Reliable chat scroll helper for fast or streaming messages
  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: instant ? 'auto' : 'smooth',
          block: 'end',
        });
      }
    }, 45);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isAiLoading]);

  // Periodic Idle Speech Bubble thoughts
  useEffect(() => {
    const idleThoughts = [
      '⚡ Piyush loves building real-time AI & 3D experiences!',
      '💤 Zzz... The 3D workstation is running smoothly...',
      '🍓 Feed me a Sitrus Berry if you like the portfolio!',
      '🚀 Ask me anything about Piyush\'s projects!',
      '📬 Ready to collaborate? Let\'s send a message!',
      '🌟 Try feeding me 5 berries for a Gigantamax surprise!',
    ];

    const interval = setInterval(() => {
      if (!isOpen && !isSleeping) {
        const thought = idleThoughts[Math.floor(Math.random() * idleThoughts.length)];
        setSpeechBubbleText(thought);
        setShowSpeechBubble(true);
        setTimeout(() => setShowSpeechBubble(false), 5000);
      }
    }, 14000);

    return () => clearInterval(interval);
  }, [isOpen, isSleeping]);

  // Audio Mute toggle
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    snorlaxAudio.setMuted(newMuted);
    if (newMuted && isSleepAsmrActive) {
      snorlaxAudio.stopSleepAsmr();
      setIsSleepAsmrActive(false);
    }
  };

  // Toggle Sleep ASMR Ambient Audio
  const toggleSleepAsmr = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSleepAsmrActive) {
      snorlaxAudio.stopSleepAsmr();
      setIsSleepAsmrActive(false);
    } else {
      if (isMuted) {
        setIsMuted(false);
        snorlaxAudio.setMuted(false);
      }
      snorlaxAudio.startSleepAsmr();
      setIsSleepAsmrActive(true);
    }
  };

  // Toggle Sleep
  const toggleSleep = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSleeping((prev) => {
      const next = !prev;
      if (next) {
        snorlaxAudio.playYawn();
        setSpeechBubbleText('Zzz... taking a power nap! 💤');
        setShowSpeechBubble(true);
        setTimeout(() => setShowSpeechBubble(false), 3000);
      } else {
        if (isSleepAsmrActive) {
          snorlaxAudio.stopSleepAsmr();
          setIsSleepAsmrActive(false);
        }
        snorlaxAudio.playHappy();
        setIsHappy(true);
        setTimeout(() => setIsHappy(false), 2000);
        setSpeechBubbleText('Wide awake and ready! ⚡');
        setShowSpeechBubble(true);
        setTimeout(() => setShowSpeechBubble(false), 3000);
      }
      return next;
    });
  };

  // Poke / Pet Snorlax
  const handlePoke = () => {
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 2200);

    if (isSleeping) {
      setIsSleeping(false);
      if (isSleepAsmrActive) {
        snorlaxAudio.stopSleepAsmr();
        setIsSleepAsmrActive(false);
      }
      snorlaxAudio.playHappy();
      setSpeechBubbleText('*Wakes up cheerfully!* 🐾 Hi friend!');
    } else {
      snorlaxAudio.playPoke();
      setSpeechBubbleText('*Giggles & jiggles* 🍓 That tickles!');
    }
    setShowSpeechBubble(true);
    setTimeout(() => setShowSpeechBubble(false), 3500);
  };

  // Bug #9 Fix & Upgrade #1, #9: Feed Berry Action with dynamic inventory and Gigantamax unlock
  const handleFeedBerry = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    let currentRemaining = berryCount;
    let didReplenish = false;

    if (currentRemaining <= 0) {
      setBerryCount(5); // replenish full pouch when empty
      didReplenish = true;
    } else {
      setBerryCount(currentRemaining - 1);
    }

    totalBerriesEatenRef.current += 1;
    setIsBerryEating(true);
    setIsHappy(true);
    snorlaxAudio.playHappy();

    const isGigaUnlock = totalBerriesEatenRef.current >= 5 && !isGigantamax;
    if (isGigaUnlock) {
      setIsGigantamax(true);
    }

    const berryMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'snorlax',
      text: isGigaUnlock
        ? `*BOOM!* ⚡ Snorlax devoured 5 berries and unlocked GIGANTAMAX MODE! Look at those glowing eyes and mighty stature! 💥`
        : `*NOM NOM NOM!* 🍓 Snorlax happily devoured a juicy Sitrus Berry! (*Happy tummy rumble*) ${
            didReplenish
              ? 'Pouch was empty so a fresh batch of 5 Sitrus Berries was picked!'
              : `(${currentRemaining - 1} left in pouch)`
          }`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, berryMsg]);

    setTimeout(() => {
      setIsBerryEating(false);
      setIsHappy(false);
    }, 2400);
  };

  // Bug #4 Fix: Send Chat Message with support for auto-send overrideText
  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = (overrideText ?? inputValue).trim();
    if (!textToSend || isAiLoading) return;

    setInputValue('');

    // Check for Gigantamax easter egg prompt
    if (textToSend.toLowerCase().includes('gigantamax')) {
      setIsGigantamax((prev) => !prev);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);
    snorlaxAudio.playMessagePop();

    // Wake up Snorlax if asleep
    if (isSleeping) {
      setIsSleeping(false);
      if (isSleepAsmrActive) {
        snorlaxAudio.stopSleepAsmr();
        setIsSleepAsmrActive(false);
      }
    }
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 2000);

    try {
      const response = await SnorlaxAiService.sendMessage(textToSend, messages);
      const snorlaxReply: ChatMessage = {
        id: `snorlax-${Date.now()}`,
        sender: 'snorlax',
        text: response.text,
        timestamp: Date.now(),
        action: response.action,
      };
      setMessages((prev) => [...prev, snorlaxReply]);
      snorlaxAudio.playMessagePop();
    } catch (err) {
      const fallbackReply: ChatMessage = {
        id: `snorlax-err-${Date.now()}`,
        sender: 'snorlax',
        text: `*Yaaawn...* I\'m still here! Let me guide you to Piyush\'s top projects or contact section! 🚀`,
        timestamp: Date.now(),
        action: { type: 'scroll', target: 'projects', label: 'View Projects 🚀' },
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Action Trigger (Scroll to section, open link, pet interactions)
  const handleActionClick = (action: NonNullable<ChatMessage['action']>) => {
    if (action.type === 'scroll') {
      const targetEl = document.getElementById(action.target);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action.type === 'link') {
      window.open(action.target, '_blank', 'noopener,noreferrer');
    } else if (action.type === 'pet') {
      if (action.target === 'sleep') {
        toggleSleep();
      } else {
        handleFeedBerry();
      }
    }
  };

  // Save Settings
  const handleSaveSettings = () => {
    SnorlaxAiService.setApiKey(apiKeyInput);
    SnorlaxAiService.setSelectedModel(selectedModel);
    setShowSettings(false);
    snorlaxAudio.playHappy();
  };

  // Quick Prompt Chips (Focused purely on Piyush Kumar & this portfolio)
  const promptSuggestions = [
    '⚡ Tell me about Piyush',
    '🎓 Education at VIT Chennai',
    '🚀 Show featured projects',
    '🛠️ Skills & Tech Stack',
    '📬 How to contact Piyush?',
    '🏆 LeetCode & Coding',
    `🍓 Feed Sitrus Berry (${berryCount})`,
    isSleeping ? '☀️ Wake up Snorlax' : '💤 Put Snorlax to sleep',
  ];

  // Don't mount in the 3D chamber to eliminate GPU context contention and respect landing page minimalism
  if (!isInPortfolio) {
    return null;
  }

  return (
    <>
      {/* Floating 3D Snorlax Pet Companion (Bottom Right) - Bug #3 Fix: elevated z-[55] to avoid admin drawer conflict */}
      <div 
        id="snorlax-pet-companion"
        className="fixed bottom-6 right-6 z-[55] flex flex-col items-end pointer-events-auto"
      >
        {/* Floating Speech Bubble (Upgrade #8: Comic-Style Thought Bubble) */}
        <AnimatePresence>
          {showSpeechBubble && !isOpen && speechBubbleText && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(true)}
              className="mb-3 relative max-w-[240px] p-3.5 rounded-2xl bg-[#091820]/95 border-2 border-teal-500/40 text-teal-100 text-xs shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(20,184,166,0.25)] backdrop-blur-md cursor-pointer hover:border-teal-400 hover:text-white transition-all group"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none select-none">🐾</span>
                <p className="font-semibold leading-relaxed tracking-wide text-[12px]">{speechBubbleText}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-teal-400 font-mono">
                <span className="flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  Click to chat
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-teal-300" />
              </div>

              {/* Comic Thought Bubble Tail pointing down towards Snorlax */}
              <div className="absolute -bottom-2 right-8 w-3.5 h-3.5 bg-[#091820] border-r-2 border-b-2 border-teal-500/40 rotate-45 transform" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Pet Bubble Card */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`relative flex items-center justify-center p-2 rounded-3xl bg-gradient-to-b from-[#0f2833]/95 via-[#091a22]/95 to-[#051117]/95 border-2 ${
            isGigantamax ? 'border-rose-500 shadow-[0_10px_35px_rgba(244,63,94,0.5)]' : 'border-teal-500/35 hover:border-teal-400/70 shadow-[0_10px_35px_rgba(15,40,51,0.55)]'
          } backdrop-blur-lg cursor-pointer select-none group`}
        >
          {/* Snorlax 3D Canvas */}
          <div className="relative">
            <Snorlax3DCanvas
              isSleeping={isSleeping}
              isHappy={isHappy || isBerryEating}
              isBerryEating={isBerryEating}
              isOpen={isOpen}
              isGigantamax={isGigantamax}
              onPoke={handlePoke}
              size={120}
            />

            {/* Berry Eating Effect Overlay */}
            {isBerryEating && (
              <motion.div
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1.25, y: -22, opacity: [0, 1, 0] }}
                transition={{ duration: 1.2 }}
                className="absolute top-2 right-2 text-2xl pointer-events-none"
              >
                🍓✨
              </motion.div>
            )}
          </div>

          {/* Quick Mini Control Strip on Hover */}
          <div className="absolute -left-12 bottom-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Sleep / Wake Button */}
            <button
              type="button"
              onClick={toggleSleep}
              title={isSleeping ? 'Wake Snorlax' : 'Put to Sleep'}
              aria-label="Toggle Snorlax sleep mode"
              className="p-2 rounded-full bg-[#081b1d] border border-teal-500/30 text-teal-300 hover:text-white hover:bg-teal-600 shadow-md transition-all active:scale-90"
            >
              {isSleeping ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Feed Berry Button */}
            <button
              type="button"
              onClick={handleFeedBerry}
              title={`Feed Sitrus Berry (${berryCount} left)`}
              aria-label="Feed Snorlax a Sitrus Berry"
              className="p-2 rounded-full bg-[#081b1d] border border-teal-500/30 text-rose-300 hover:text-white hover:bg-rose-600 shadow-md transition-all active:scale-90"
            >
              <span className="text-xs">🍓</span>
            </button>

            {/* Audio Mute Button */}
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute Snorlax Sounds' : 'Mute Sounds'}
              aria-label="Toggle Snorlax audio"
              className="p-2 rounded-full bg-[#081b1d] border border-teal-500/30 text-slate-400 hover:text-white hover:bg-teal-700 shadow-md transition-all active:scale-90"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Chat Launcher Pill Badge */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Open Snorlax AI Chat"
            className="absolute -bottom-2 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-[11px] font-bold shadow-[0_2px_12px_rgba(20,184,166,0.5)] flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat AI</span>
          </button>
        </motion.div>
      </div>

      {/* Expanded Snorlax AI Companion Window - Bug #3 Fix: elevated z-[55] */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            id="snorlax-ai-chat-window"
            className="fixed bottom-6 right-6 z-[55] w-[92vw] max-w-[420px] h-[580px] max-h-[85vh] rounded-3xl bg-[#061014]/98 border-2 border-teal-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(20,83,85,0.3)] backdrop-blur-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="p-3.5 px-4 bg-gradient-to-r from-[#0d2a2d] to-[#07191c] border-b border-teal-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 3D Mini Avatar */}
                <div 
                  onClick={handlePoke}
                  className="w-11 h-11 rounded-2xl bg-teal-950/80 border border-teal-400/40 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  <Snorlax3DCanvas
                    isSleeping={isSleeping}
                    isHappy={isHappy}
                    isGigantamax={isGigantamax}
                    size={52}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-teal-300">
                      {isGigantamax ? 'Gigantamax Snorlax' : 'Snorlax Companion'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 border border-teal-500/30 text-teal-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      {isSleeping ? 'Sleep Mode' : 'Online'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Piyush Kumar's AI Pet & Guide</p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                {isSleeping && (
                  <button
                    type="button"
                    onClick={toggleSleepAsmr}
                    title={isSleepAsmrActive ? 'Stop Sleep ASMR' : 'Play Gentle Sleep ASMR Lullaby'}
                    className={`p-1.5 rounded-xl transition-colors ${
                      isSleepAsmrActive ? 'text-teal-300 bg-teal-500/30 ring-1 ring-teal-400' : 'text-slate-400 hover:text-teal-300 hover:bg-teal-500/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleSleep}
                  title={isSleeping ? 'Wake Snorlax' : 'Sleep'}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
                >
                  {isSleeping ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  title="OpenRouter API Settings"
                  className={`p-1.5 rounded-xl transition-colors ${
                    showSettings ? 'text-teal-400 bg-teal-500/20' : 'text-slate-400 hover:text-teal-300 hover:bg-teal-500/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upgrade #3: Sleep Night Card with ASMR Audio & Video Controls */}
            {isSleeping && (
              <div className="mx-4 mt-3 p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/35 flex items-center justify-between text-xs text-indigo-100 shadow-inner">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-300 animate-pulse" />
                  <div>
                    <p className="font-bold text-[11px]">Snorlax is sound asleep</p>
                    <p className="text-[10px] text-indigo-300/80">Soft breathing & calming vibes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleSleepAsmr}
                    className="px-2 py-1 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-[10px] font-bold text-white transition-all flex items-center gap-1"
                  >
                    {isSleepAsmrActive ? '⏸️ ASMR' : '▶️ Sleep Lullaby'}
                  </button>
                  <a
                    href="https://www.youtube.com/watch?v=Rx68Kyo22iA"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Official Pokémon Sleep ASMR Video"
                    className="p-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-[10px] text-indigo-300 flex items-center gap-0.5"
                  >
                    <span>ASMR</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Settings Overlay (OpenRouter Config) - Bug #8: Guaranteed button type="button" */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 bg-[#09181d] border-b border-teal-500/30 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-teal-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      OpenRouter API Configuration
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                  </div>
                  <p className="text-slate-400 mb-3 text-[11px] leading-relaxed">
                    Connect your own OpenRouter key to power Snorlax with cutting-edge LLMs (or leave blank to use the built-in instant portfolio reasoning engine!).
                  </p>
                  
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                        API Key (sk-or-...)
                      </label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-teal-500/30 text-teal-200 placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                        AI Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-teal-500/30 text-teal-200 focus:outline-none focus:border-teal-400 font-mono text-xs"
                      >
                        {DEFAULT_MODELS.map((m) => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 active:scale-95 transition-all"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-teal-900 scrollbar-track-transparent">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-none shadow-md'
                        : 'bg-[#0a1e22] border border-teal-500/25 text-slate-200 rounded-bl-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Action Button (Jump to section or pet Snorlax) */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-teal-500/20 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.action!)}
                          className="px-3 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-400/40 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <span>{msg.action.label}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* AI Loading Bubble */}
              {isAiLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-3 rounded-2xl rounded-bl-none bg-[#0a1e22] border border-teal-500/25 text-teal-400 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-slate-400 ml-1">Snorlax is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips - Bug #4 Fix: Auto-send on click without requiring extra send tap */}
            <div className="px-3 py-2 bg-[#040e12] border-t border-teal-500/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    if (prompt.includes('Berry')) {
                      handleFeedBerry();
                    } else if (prompt.includes('sleep') || prompt.includes('Wake up')) {
                      toggleSleep();
                    } else {
                      handleSendMessage(undefined, prompt);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-teal-950/60 hover:bg-teal-800/50 border border-teal-500/20 hover:border-teal-400/60 text-[10px] text-teal-300 whitespace-nowrap transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>{prompt}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="p-3 bg-[#061217] border-t border-teal-500/20 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Snorlax about Piyush's work..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-teal-500/30 text-teal-100 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-400 font-sans"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isAiLoading}
                aria-label="Send message"
                className="p-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
