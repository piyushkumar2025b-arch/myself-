import React from 'react';

interface BrandIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ name, className = "w-5 h-5", size = 20 }) => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  switch (normalized) {
    case 'react':
    case 'reactjs':
      return (
        <svg width={size} height={size} viewBox="-11.5 -10.23174 23 20.46348" className={className}>
          <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
          <g stroke="#61dafb" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      );

    case 'nextjs':
    case 'next':
      return (
        <svg width={size} height={size} viewBox="0 0 180 180" className={className} fill="none">
          <mask id="nextjs-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180" style={{ maskType: 'alpha' }}>
            <circle cx="90" cy="90" r="90" fill="black" />
          </mask>
          <g mask="url(#nextjs-mask)">
            <circle cx="90" cy="90" r="90" fill="#000" stroke="#fff" strokeWidth="6" />
            <path d="M149.508 157.438L69.1478 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z" fill="url(#nextjs-gradient)" />
            <rect x="115" y="54" width="12" height="72" fill="url(#nextjs-gradient2)" />
          </g>
          <defs>
            <linearGradient id="nextjs-gradient" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nextjs-gradient2" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'typescript':
    case 'ts':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          <rect width="24" height="24" rx="4" fill="#3178C6" />
          <path d="M4 8h6v2H7.5v8h-2v-8H4V8zm7.5 3.5c.5-.7 1.3-1.1 2.3-1.1 1.6 0 2.7 1 2.7 2.6v.1c0 1.5-.9 2.3-2.3 2.8l-.8.3c-.8.3-1.2.6-1.2 1.1v.1c0 .6.5 1 1.2 1 .7 0 1.3-.3 1.8-.8l1.1 1.3c-.8.8-1.8 1.2-2.9 1.2-1.9 0-3.1-1.1-3.1-2.7v-.1c0-1.4.9-2.3 2.3-2.8l.8-.3c.7-.2 1.1-.5 1.1-1v-.1c0-.5-.4-.9-1-.9-.6 0-1.1.3-1.5.7l-1.1-1.3z" fill="#ffffff" />
        </svg>
      );

    case 'javascript':
    case 'js':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          <rect width="24" height="24" rx="4" fill="#F7DF1E" />
          <path d="M6 14.5c.3.9 1 1.5 2 1.5 1.1 0 1.8-.6 1.8-1.5v-6h2.2v6.1c0 2.2-1.5 3.4-3.8 3.4-2.1 0-3.4-1.2-3.8-2.6l1.6-.9zm7.5.4c.5.8 1.3 1.3 2.4 1.3 1 0 1.6-.5 1.6-1.2 0-.8-.7-1.1-1.8-1.6l-.6-.3c-1.8-.8-3-1.7-3-3.7 0-1.9 1.5-3.3 3.7-3.3 1.7 0 2.8.6 3.5 1.9l-1.7 1.1c-.4-.7-.9-1-1.8-1-.9 0-1.4.5-1.4 1.1 0 .7.5 1 1.6 1.5l.6.3c2.1.9 3.2 1.8 3.2 3.8 0 2.1-1.6 3.5-4 3.5-2.2 0-3.6-1.1-4.2-2.6l1.9-1.1z" fill="#000000" />
        </svg>
      );

    case 'tailwindcss':
    case 'tailwind':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.335 6.182 14.974 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.335 13.382 8.974 12 6.001 12z" fill="#38BDF8" />
        </svg>
      );

    case 'nodejs':
    case 'node':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none">
          <path d="M16 2.5L3.5 9.7v14.6L16 31.5l12.5-7.2V9.7L16 2.5z" fill="#539E43" />
          <path d="M16 4.9l9.9 5.7v11.4L16 27.7 6.1 22V10.6L16 4.9z" fill="#68A063" />
          <path d="M16 12a4 4 0 100 8 4 4 0 000-8z" fill="#ffffff" />
        </svg>
      );

    case 'python':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M11.91 2c-5.26 0-4.93 2.28-4.93 2.28l.01 2.37h5.02v.71H4.95S2 7.02 2 12.3c0 5.27 2.58 5.09 2.58 5.09h1.54v-2.16s-.08-2.58 2.54-2.58h5.01v-.74H8.76v-2.42h8.17s2.51.27 2.51-4.72c0-4.99-2.26-5.07-2.26-5.07h-5.27zM9.54 3.7a.82.82 0 110 1.64.82.82 0 010-1.64z" fill="#3776AB" />
          <path d="M12.09 22c5.26 0 4.93-2.28 4.93-2.28l-.01-2.37h-5.02v-.71h7.06S22 16.98 22 11.7c0-5.27-2.58-5.09-2.58-5.09h-1.54v2.16s.08 2.58-2.54 2.58h-5.01v.74h4.91v2.42H6.98S4.47 16.24 4.47 21.23c0 4.99 2.26 5.07 2.26 5.07h5.36zM14.46 20.3a.82.82 0 110-1.64.82.82 0 010-1.64z" fill="#FFD43B" />
        </svg>
      );

    case 'c':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="4" fill="#00599C" />
          <path d="M16.5 8.5C15.5 7 13.8 6.5 12 6.5C8.7 6.5 6.5 8.8 6.5 12C6.5 15.2 8.7 17.5 12 17.5C14 17.5 15.6 16.8 16.6 15.3" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'cpp':
    case 'cplusplus':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="4" fill="#00599C" />
          <path d="M11 8.5C10.2 7.4 9 7 7.6 7C5.3 7 3.8 8.8 3.8 11.5C3.8 14.2 5.3 16 7.6 16C9 16 10.2 15.4 11 14.3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M13.5 11.5H16.5M15 10V13M18 11.5H21M19.5 10V13" stroke="#659AD2" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'html':
    case 'html5':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M3 2L4.8 19.5L12 21.5L19.2 19.5L21 2H3Z" fill="#E44D26" />
          <path d="M12 3.6V19.8L17.7 18.2L19.2 3.6H12Z" fill="#F16529" />
          <path d="M7 6.5H17L16.6 10.2H12V12.4H16.3L15.9 15.7L12 16.8V19L17.5 17.5L18.2 6.5H7Z" fill="#EBEBEB" />
          <path d="M12 6.5H7.3L7.7 10.2H12V6.5ZM12 12.4H7.9L8.2 15.7L12 16.8V12.4Z" fill="#ffffff" />
        </svg>
      );

    case 'java':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M8.5 18.5C8.5 18.5 10 19.5 13.5 19.5C16.5 19.5 18.5 18.5 18.5 18.5C18.5 18.5 17.5 21 12 21C6.5 21 8.5 18.5 8.5 18.5Z" fill="#5382A1" />
          <path d="M7 16C7 16 9 17.2 13 17.2C16.5 17.2 19 16 19 16C19 16 18 18 12.5 18C7 18 7 16 7 16Z" fill="#E76F00" />
          <path d="M13 3C13 3 14.5 5 12 7.5C10 9.5 10.5 11 12.5 12.5C10.5 12.5 9 11 9 9.5C9 7.5 13 5.5 13 3Z" fill="#E76F00" />
          <path d="M15.5 5.5C15.5 5.5 17 7.5 14.5 9.5C13 10.7 13.5 12 14.5 13C13 13 11.5 11.5 12 10C12.5 8.5 15.5 7 15.5 5.5Z" fill="#5382A1" />
        </svg>
      );

    case 'json':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="4" fill="#1E293B" />
          <text x="12" y="15.5" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {'{ }'}
          </text>
        </svg>
      );

    case 'sql':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="4" fill="#00758F" />
          <path d="M6 7C6 5.5 8.7 4.5 12 4.5C15.3 4.5 18 5.5 18 7C18 8.5 15.3 9.5 12 9.5C8.7 9.5 6 8.5 6 7Z" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M6 7V17C6 18.5 8.7 19.5 12 19.5C15.3 19.5 18 18.5 18 17V7" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M6 12C6 13.5 8.7 14.5 12 14.5C15.3 14.5 18 13.5 18 12" stroke="#ffffff" strokeWidth="1.2" />
        </svg>
      );

    case 'mongodb':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 1.5C12 1.5 6.5 7.5 6.5 13.5C6.5 17.5 9 21 12 22.5C15 21 17.5 17.5 17.5 13.5C17.5 7.5 12 1.5 12 1.5Z" fill="#47A248" />
          <path d="M12 2.5V22C14.8 20.6 17 17.3 17 13.5C17 8 12 2.5 12 2.5Z" fill="#499D4A" />
          <path d="M12 21.5V13.5H11.5V21.3C11.66 21.38 11.83 21.44 12 21.5Z" fill="#ffffff" opacity="0.6" />
        </svg>
      );

    case 'git':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M22.04 10.56L13.44 1.96a2.02 2.02 0 00-2.86 0L8.6 3.94l3.62 3.62a2.38 2.38 0 012.3 2.31 2.38 2.38 0 01-.65 1.63l3.48 3.48a2.38 2.38 0 011.63-.65 2.4 2.4 0 11-2.4 2.4c0-.4.1-.77.27-1.1L13.5 13.29v4.29a2.4 2.4 0 11-2.4-2.4c.3 0 .59.06.85.17V10.9a2.38 2.38 0 01-1.12-1.65L7.26 5.68 1.96 10.98a2.02 2.02 0 000 2.86l8.6 8.6c.79.79 2.07.79 2.86 0l8.62-8.62a2.02 2.02 0 000-2.86z" fill="#F05032" />
        </svg>
      );

    case 'docker':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M13.98 9.07h1.96v1.96h-1.96zm-2.45 0h1.96v1.96h-1.96zm-2.45 0h1.96v1.96H9.08zm-2.45 0h1.96v1.96H6.63zm4.9 2.45h1.96v1.96h-1.96zm-2.45 0h1.96v1.96H9.08zm-2.45 0h1.96v1.96H6.63zm-2.45 0h1.96v1.96H4.18zm7.35-4.9h1.96v1.96h-1.96zm-2.45 0h1.96v1.96H9.08zm14.37 5.76c-.34-.23-1.12-.34-1.74-.08-.18.08-.34.2-.46.34-.67-.42-1.57-.55-2.48-.37-.09-.32-.26-.61-.48-.84l-.3-.31-.38.2c-.79.42-1.32 1.13-1.48 1.97H1.36c-.4 0-.74.31-.76.71-.16 2.76.78 5.48 2.65 7.46 1.67 1.77 3.93 2.76 6.37 2.78 5.6 0 10.23-3.95 11.23-9.33.86-.04 1.73-.39 2.25-1.02.32-.38.45-.88.38-1.38-.07-.49-.33-.94-.7-1.13z" fill="#2496ED" />
        </svg>
      );

    case 'googlecolab':
    case 'colab':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M16.9 7.8c-2.3 0-4.2 1.9-4.2 4.2 0 1.2.5 2.3 1.3 3.1l1.5-1.5c-.5-.4-.8-1-.8-1.6 0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2-1 2.2-2.2 2.2c-.6 0-1.2-.3-1.6-.8l-1.5 1.5c.8.8 1.9 1.3 3.1 1.3 2.3 0 4.2-1.9 4.2-4.2s-1.9-4.2-4.2-4.2z" fill="#F9AB00" />
          <path d="M7.1 7.8C4.8 7.8 2.9 9.7 2.9 12s1.9 4.2 4.2 4.2c1.2 0 2.3-.5 3.1-1.3L8.7 13.4c-.4.5-1 .8-1.6.8-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2c.6 0 1.2.3 1.6.8l1.5-1.5C9.4 8.3 8.3 7.8 7.1 7.8z" fill="#E37400" />
        </svg>
      );

    case 'antigravity':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0B132B" />
          <circle cx="12" cy="12" r="7" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="12" cy="12" r="3" fill="url(#antigrav-grad)" />
          <path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="antigrav-grad" x1="9" y1="9" x2="15" y2="15" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'cursor':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path d="M12 4.5L19 8.5V15.5L12 19.5L5 15.5V8.5L12 4.5Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
          <path d="M12 4.5V19.5M5 8.5L12 12.5L19 8.5M5 15.5L12 12.5L19 15.5" stroke="#38BDF8" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="2" fill="#38BDF8" />
        </svg>
      );

    case 'kiro':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#4F46E5" />
          <circle cx="12" cy="12" r="6" fill="#ffffff" />
          <circle cx="10" cy="11" r="1.5" fill="#4F46E5" />
          <circle cx="14" cy="11" r="1.5" fill="#4F46E5" />
          <path d="M9.5 14C10.5 15.2 13.5 15.2 14.5 14" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'googleaistudio':
    case 'aistudio':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#131722" />
          <path d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z" fill="url(#aistudio-sparkle)" />
          <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
          <defs>
            <linearGradient id="aistudio-sparkle" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4285F4" />
              <stop offset="0.33" stopColor="#9B72CB" />
              <stop offset="0.66" stopColor="#D96570" />
              <stop offset="1" stopColor="#FFC107" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'opencode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0D1117" />
          <path d="M7.5 8L3.5 12L7.5 16M16.5 8L20.5 12L16.5 16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 6L10 18" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'claudecode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#1C1814" />
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#D97706" strokeWidth="1.5" />
          <path d="M7 8.5L11 12L7 15.5M12.5 15.5H16.5" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'n8n':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#EA4B71" />
          <circle cx="6.5" cy="12" r="2.2" fill="#ffffff" />
          <circle cx="17.5" cy="7.5" r="2.2" fill="#ffffff" />
          <circle cx="17.5" cy="16.5" r="2.2" fill="#ffffff" />
          <path d="M8.7 12H12.5M12.5 12L15.3 7.5M12.5 12L15.3 16.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'hermesagent':
    case 'hermes':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#1E1B4B" />
          <path d="M12 4L5 8.5V14.5C5 18 8 20.5 12 21.5C16 20.5 19 18 19 14.5V8.5L12 4Z" stroke="#A78BFA" strokeWidth="1.5" fill="#312E81" />
          <path d="M9 12.5L11.5 15L16 9.5" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'codex':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0D281E" />
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#10A37F" strokeWidth="1.5" />
          <path d="M7.5 8H16.5M7.5 12H14M7.5 16H11" stroke="#10A37F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'figma':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M8.5 2.5C7.12 2.5 6 3.62 6 5s1.12 2.5 2.5 2.5H12V2.5H8.5z" fill="#F24E1E" />
          <path d="M12 2.5h3.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5H12V2.5z" fill="#FF7262" />
          <path d="M12 7.5H8.5C7.12 7.5 6 8.62 6 10s1.12 2.5 2.5 2.5H12V7.5z" fill="#A259FF" />
          <path d="M12 7.5h3.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5H12V7.5z" fill="#1ABCFE" />
          <path d="M8.5 12.5C7.12 12.5 6 13.62 6 15s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5V12.5H8.5z" fill="#0ACF83" />
        </svg>
      );

    case 'rocket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#881337" />
          <path d="M14.5 4.5C11.5 5 8.5 8 8 11L6 13L8 14L9 16L11 14C14 13.5 17 10.5 17.5 7.5L14.5 4.5Z" fill="#F43F5E" />
          <circle cx="13" cy="9" r="1.5" fill="#ffffff" />
          <path d="M6 18L7.5 15.5L8.5 16.5L6 18Z" fill="#FBBF24" />
        </svg>
      );

    case 'replit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0E1525" />
          <path d="M5.5 5.5H11.5V10.5H5.5V5.5Z" fill="#F26207" />
          <path d="M11.5 10.5H17.5V15.5H11.5V10.5Z" fill="#F26207" />
          <path d="M5.5 15.5H11.5V20.5H5.5V15.5Z" fill="#F26207" />
        </svg>
      );

    case 'vercel':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path d="M12 6L19 18H5L12 6Z" fill="#ffffff" />
        </svg>
      );

    case 'railway':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0B0D0E" />
          <path d="M4 14C4 10 7 7.5 12 7.5C17 7.5 20 10 20 14H4Z" stroke="#E2E8F0" strokeWidth="2" fill="none" />
          <circle cx="8" cy="14" r="1.8" fill="#A855F7" />
          <circle cx="16" cy="14" r="1.8" fill="#A855F7" />
        </svg>
      );

    case 'claude':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#241812" />
          <path d="M12 4L13.8 8.8L18.5 7.5L15.8 11.5L20 13.5L15.5 15.2L16.8 20L12.5 17.5L10 21.5L9.2 16.8L4.5 18L6.8 13.8L2.5 12L7 10.2L5.5 5.5L10 7.8L12 4Z" fill="#D97706" />
        </svg>
      );

    case 'grok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path d="M5.5 18.5L18.5 5.5M6 5.5L18.5 18.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'gemini':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0B1120" />
          <path d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z" fill="url(#gemini-sparkle-grad)" />
          <defs>
            <linearGradient id="gemini-sparkle-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#818CF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'deepseek':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0369A1" />
          <path d="M6 14.5C7.5 12.5 10 12 12.5 13C15 14 17.5 13 18.5 10.5C18.5 14 16 17.5 12 17.5C8.5 17.5 6.5 16 6 14.5Z" fill="#ffffff" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'glm':
    case 'chatglm':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#1E1B4B" />
          <path d="M12 4.5L18.5 8.25V15.75L12 19.5L5.5 15.75V8.25L12 4.5Z" stroke="#818CF8" strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="3" fill="#38BDF8" />
          <path d="M12 4.5V12M18.5 8.25L12 12M18.5 15.75L12 12M12 19.5V12M5.5 15.75L12 12M5.5 8.25L12 12" stroke="#818CF8" strokeWidth="1" />
        </svg>
      );

    case 'vscode':
    case 'visualstudiocode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M17.5 2.5L7.5 10.5L3.5 7.5L2 8.5V15.5L3.5 16.5L7.5 13.5L17.5 21.5L22 19.5V4.5L17.5 2.5Z" fill="#007ACC" />
          <path d="M17.5 2.5L7.5 10.5L17.5 21.5V2.5Z" fill="#1F9CF0" />
        </svg>
      );

    case 'trae':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0A1118" />
          <path d="M6 7H18M12 7V17M12 17H16" stroke="#22D3EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'cloudflare':
    case 'cloudfare':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M18.2 11.2C17.7 8.5 15.4 6.5 12.5 6.5c-2.3 0-4.3 1.3-5.2 3.2C5.3 10 3.7 11.8 3.7 14c0 2.5 2 4.5 4.5 4.5h9.8c2.2 0 4-1.8 4-4 0-1.8-1.2-3.3-2.8-3.8z" fill="#F38020" />
          <path d="M14.5 18.5h3.5c1.7 0 3-1.3 3-3 0-1.4-.9-2.5-2.2-2.9-.3-2.1-2.1-3.6-4.3-3.6-1.8 0-3.3 1-3.9 2.5.5.5.9 1.1 1.1 1.8.8.1 1.5.5 1.9 1.1.4.6.6 1.4.5 2.2l.4 1.9z" fill="#FAAE40" />
        </svg>
      );

    case 'kubernetes':
    case 'kubernits':
    case 'k8s':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#326CE5" />
          <circle cx="12" cy="12" r="5" stroke="#ffffff" strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="2" fill="#ffffff" />
          <path d="M12 4.5V7M12 17V19.5M4.5 12H7M17 12H19.5M6.7 6.7L8.5 8.5M15.5 15.5L17.3 17.3M6.7 17.3L8.5 15.5M15.5 8.5L17.3 6.7" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'obsidian':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#140E26" />
          <path d="M12 3L18 8L19.5 15L12 21L4.5 15L6 8L12 3Z" fill="#4C1D95" stroke="#8B5CF6" strokeWidth="1.2" />
          <path d="M12 3L8.5 9.5L12 12L15.5 9.5L12 3Z" fill="#7C3AED" />
          <path d="M12 12L7 15.5L12 21L17 15.5L12 12Z" fill="#6D28D9" />
          <path d="M6 8L8.5 9.5L7 15.5L4.5 15L6 8Z" fill="#5B21B6" />
          <path d="M18 8L15.5 9.5L17 15.5L19.5 15L18 8Z" fill="#8B5CF6" />
        </svg>
      );

    case 'perplexity':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#0A1821" />
          {/* Perplexity Asterism Logo */}
          <path d="M12 4V20M4 12H20M6.34 6.34L17.66 17.66M17.66 6.34L6.34 17.66" stroke="#22B8CD" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#0A1821" stroke="#22B8CD" strokeWidth="1.5" />
        </svg>
      );

    case 'streamlit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#18181B" />
          <path d="M17.5 7.5L22 17H2L6.5 7.5L12 15L17.5 7.5Z" fill="#FF4B4B" />
          <path d="M12 4.5L15.5 11H8.5L12 4.5Z" fill="#FF8080" />
        </svg>
      );

    case 'telegram':
    case 'telegrambot':
    case 'telegrambotown':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#229ED9" />
          <path d="M18 6.5L4.5 11.8L9 13.7L15.5 9.5L10.5 15.2V18.5L13 16.2L16.8 18.5L18.5 7L18 6.5Z" fill="#ffffff" />
        </svg>
      );

    case 'chatgpt':
    case 'openai':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect width="24" height="24" rx="5" fill="#10A37F" />
          <g transform="translate(4,4) scale(0.666)">
            <path d="M20.5 11.2C20.1 8.8 18.3 7 15.9 6.7C15.5 4.5 13.5 3 11.2 3.2C9.5 3.3 8 4.3 7.3 5.8C5.2 6.5 3.8 8.5 4 10.8C4.1 11.8 4.6 12.8 5.4 13.5C5 15.8 6.2 18.1 8.3 19.1C9.2 19.5 10.2 19.7 11.2 19.5C11.8 21.6 13.8 23 16.1 22.8C17.8 22.6 19.3 21.6 20 20C21.9 19.1 23.1 17 22.8 14.8C22.6 13.4 21.7 12.1 20.5 11.2Z" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
          </g>
        </svg>
      );

    // Social icons
    case 'github':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );

    case 'gmail':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 6L12 13L2 6" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1" fill="#E1306C" />
        </svg>
      );

    case 'linkedin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );

    case 'codeforces':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <rect x="2.5" y="11" width="4.5" height="9" rx="1.2" fill="#FFD43B" />
          <rect x="9.5" y="5" width="4.5" height="15" rx="1.2" fill="#3B82F6" />
          <rect x="16.5" y="8.5" width="4.5" height="11.5" rx="1.2" fill="#EF4444" />
        </svg>
      );

    case 'leetcode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .2 3.54 5.29 5.29 0 0 0 2.465 2.81 5.314 5.314 0 0 0 3.336.529 5.253 5.253 0 0 0 3.067-1.483l4.554-4.205a1.253 1.253 0 0 0 0-1.77 1.253 1.253 0 0 0-1.77 0l-4.554 4.205a2.753 2.753 0 0 1-1.606.777 2.814 2.814 0 0 1-1.745-.277 2.79 2.79 0 0 1-1.298-1.48 2.927 2.927 0 0 1-.1-1.864 2.766 2.766 0 0 1 .634-1.107l3.854-4.126 5.406-5.788A1.374 1.374 0 0 0 13.483 0z" fill="#FFA116" />
          <path d="M9.86 12.04h9.14a1.25 1.25 0 0 0 0-2.5H9.86a1.25 1.25 0 1 0 0 2.5z" fill="#ffffff" />
        </svg>
      );

    case 'huggingface':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="12" r="9.5" fill="#FFD21E" />
          {/* Eyes */}
          <circle cx="8.5" cy="10" r="1.4" fill="#000000" />
          <circle cx="15.5" cy="10" r="1.4" fill="#000000" />
          {/* Smile */}
          <path d="M8.5 14.5C9.5 16 14.5 16 15.5 14.5" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" />
          {/* Hugging hands */}
          <path d="M4.5 12C3 13.5 3 16 4.5 17" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M19.5 12C21 13.5 21 16 19.5 17" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
};
