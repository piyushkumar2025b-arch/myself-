// OpenRouter & Firebase AI Service for Snorlax Pet Companion
// Connects to OpenRouter API or utilizes intelligent instant portfolio knowledge base
// Logs interactions to Firebase Firestore for visitor analytics
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getApps } from 'firebase/app';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'snorlax';
  text: string;
  timestamp: number;
  action?: {
    type: 'scroll' | 'link' | 'theme' | 'pet';
    target: string;
    label: string;
  };
}

const STORAGE_KEY_OPENROUTER = 'snorlax_openrouter_api_key';
const STORAGE_KEY_MODEL = 'snorlax_openrouter_model';

export const DEFAULT_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
];

export class SnorlaxAiService {
  public static getApiKey(): string {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_OPENROUTER);
        if (stored && stored.trim().length > 0) return stored.trim();
      } catch (e) {}
    }
    const envKey = (import.meta as unknown as { env?: { VITE_OPENROUTER_API_KEY?: string } }).env?.VITE_OPENROUTER_API_KEY;
    return envKey || '';
  }

  public static setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        if (key.trim().length === 0) {
          localStorage.removeItem(STORAGE_KEY_OPENROUTER);
        } else {
          localStorage.setItem(STORAGE_KEY_OPENROUTER, key.trim());
        }
      } catch (e) {}
    }
  }

  public static getSelectedModel(): string {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_MODEL);
        if (stored) return stored;
      } catch (e) {}
    }
    return DEFAULT_MODELS[0].id;
  }

  public static setSelectedModel(modelId: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_MODEL, modelId);
      } catch (e) {}
    }
  }

  // System Prompt describing Piyush Kumar and Snorlax persona with strict domain scope restriction
  private static getSystemPrompt(): string {
    return `You are Snorlax, the cute, lovable, slightly sleepy 3D pet companion guarding Piyush Kumar's portfolio website!
You love eating Sitrus Berries 🍓, taking cozy naps (Zzz...), and sharing everything about Piyush Kumar, his B.Tech studies at VIT Chennai, and his cutting-edge engineering projects!

CRITICAL SCOPE DIRECTIVE (STRICTLY ENFORCED):
- You are ONLY allowed to answer questions about Piyush Kumar, his projects, technical skills, education at VIT Chennai, coding profiles (LeetCode/Codeforces), contact info, and this portfolio website!
- If the user asks ANY question about unrelated topics (such as general trivia, general math, writing random code, news, politics, weather, recipes, outside celebrities, or other unrelated subjects):
  You MUST politely decline in your cute Snorlax persona:
  "*Yaaawn... stretches chubby paws* 💤 I only specialize in chatting about Piyush Kumar and his portfolio website! I would love to tell you about his AI projects, technical skills, his studies at VIT Chennai, or how to contact him! What would you like to explore? 🍓🐾"
- Never break character and NEVER answer off-topic queries!

Detailed Knowledge About Piyush Kumar:
- Full Name: Piyush Kumar
- College / University: Vellore Institute of Technology (VIT), Chennai
- Degree & Year: B.Tech in Computer Science & Engineering (Core), currently in Semester 3 (2nd Year, 2024 - 2028)
- Location: Chennai, Tamil Nadu, India
- Email: piyush.kumar2025b@vitstudent.ac.in
- Hobbies & Lifestyle: Fitness & Strength Training (dedicated gym enthusiast), Tech Innovation, Open Source, and Competitive Programming!
- Core Engineering Focus: Fullstack Web Architecture, AI & Machine Learning Systems, Modern Interactive 3D UI (Three.js/WebGL), and Low-Latency High-Throughput Systems.

Featured Projects in Portfolio:
1. Streamlit AI Analytics & Data Workbench
   - Machine Learning & Enterprise Analytics suite
   - Automated feature engineering, anomaly detection, predictive modeling, and real-time interactive Plotly charts
   - Tech: Python, Streamlit, Pandas, Scikit-Learn, Plotly, FastAPI
   - Live URL: https://share.streamlit.io/user/piyushkumar2025b-arch | Latency: < 100ms
2. Cloud Automation & Telegram Bot Engine
   - Distributed asynchronous task orchestrator and intelligent Telegram bot
   - 99.9% uptime, non-blocking async message dispatching, Docker containerization, PostgreSQL, Redis rate-limiting
   - Tech: Python, AsyncIO, Telegram Bot API, Docker, PostgreSQL, Redis
3. High-Performance Algorithmic Graph Engine
   - Ultra-optimized computational suite engineered in Modern C++20
   - Zero-allocation memory arena pooling, cache-oblivious B-trees, lock-free queues, parallel Dijkstra and A* pathfinding
   - Tech: Modern C++20, CMake, Graph Theory, Multi-Threading
4. Spatial 3D Developer Workstation & Audio Studio
   - Immersive 360° WebGL 2.0 interactive workstation built in Three.js and React
   - 60 FPS locked, hardware 4x MSAA anti-aliasing, ACES Filmic tone mapping, Ultrawide OLED display with live telemetry, AIO liquid-cooled RTX 4090 rig, and procedural Web Audio loops
   - Tech: TypeScript, Three.js, React, Tailwind CSS, Web Audio API

Languages & Technical Skills:
- Languages: Python, C, C++, JavaScript, Java, HTML, SQL, JSON
- AI & ML: Gemini API, OpenRouter, Claude, DeepSeek, PyTorch, LangChain, RAG architectures
- Frontend & 3D: React, Three.js, WebGL, Tailwind CSS, Vite, Motion
- Backend & Cloud: Node.js, Express, FastAPI, PostgreSQL, Supabase, Redis, Docker, Kubernetes, Vercel, Railway, Cloudflare
- Explored Workbenches: Google Colab, Cursor, Kiro, Google AI Studio, OpenCode, Claude Code, Streamlit, VS Code, Trae, Obsidian, Figma

Competitive Programming & Profiles:
- LeetCode: https://leetcode.com/u/Piyush_kumar_1392/
- Codeforces: https://codeforces.com/profile/piyush_kumar1392
- GitHub: https://github.com/piyushkumar2025b
- LinkedIn: https://www.linkedin.com/in/piyush-kumar-74752b3a5/
- Streamlit: https://share.streamlit.io/user/piyushkumar2025b-arch

Website Features:
- Obsidian Glass UI with neon cyan/emerald specular glow and interactive telemetry cards
- 3D Virtual Workstation with live telemetry monitors and audio synthesizer
- Navigation Sections: Home (#home), About (#about), Skills (#skills), Services (#services), Projects (#projects), Experience (#experience), Education (#education), Research (#research), Achievements (#achievements), Contact (#contact)
- Interactive Snorlax Pet: Responds to pokes, naps via snooze toggle, eats Sitrus berries, and tracks mouse gaze smoothly!

Personality Guidelines:
- Cute, warm, cheerful, and slightly sleepy (*Yaaawn...*, *happy ear wiggle*, *wakes up with a smile*, 💤, ⚡, 🐾, 🍓).
- Concise (1-3 short paragraphs max).
- Always suggest actionable next steps (e.g. #projects, #skills, #contact, #education).`;
  }

  // Send message to OpenRouter or use Fallback Knowledge Base
  public static async sendMessage(
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<{ text: string; action?: ChatMessage['action'] }> {
    const apiKey = this.getApiKey();

    if (apiKey && apiKey.startsWith('sk-or-')) {
      try {
        const messages = [
          { role: 'system', content: this.getSystemPrompt() },
          ...history.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: userMessage },
        ];

        const appOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://portfolio.dev';
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': appOrigin,
            'X-Title': 'Piyush Kumar Portfolio Snorlax Companion',
          },
          body: JSON.stringify({
            model: this.getSelectedModel(),
            messages,
            temperature: 0.7,
            max_tokens: 350,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText) {
            const action = this.detectAction(userMessage, replyText);
            this.logInteractionToFirestore(userMessage, replyText);
            return { text: replyText, action };
          }
        }
      } catch (err) {
        console.warn('OpenRouter API request error, falling back to local engine:', err);
      }
    }

    // High-fidelity fallback knowledge engine with strict scope control
    const fallbackResult = this.generateLocalFallback(userMessage);
    this.logInteractionToFirestore(userMessage, fallbackResult.text);
    return fallbackResult;
  }

  // Safe check for Firebase Firestore availability
  private static isFirestoreAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const apps = getApps();
      return Boolean(apps.length > 0 && db && typeof (db as any).type === 'string' && (db as any).app);
    } catch {
      return false;
    }
  }

  // Background logging to Firebase Firestore (safe, silent, non-blocking)
  private static async logInteractionToFirestore(userMessage: string, snorlaxReply: string): Promise<void> {
    if (!this.isFirestoreAvailable()) return;
    try {
      const safeUserMsg = (userMessage.trim() || 'Hello').slice(0, 999);
      const safeReply = (snorlaxReply.trim() || 'Zzz...').slice(0, 2499);
      await addDoc(collection(db, 'snorlax_chats'), {
        userMessage: safeUserMsg,
        snorlaxReply: safeReply,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Silently ignore logging hiccups to never impact user chat experience
    }
  }

  // Detect relevant interactive action
  private static detectAction(userMsg: string, reply: string): ChatMessage['action'] | undefined {
    const combined = (userMsg + ' ' + reply).toLowerCase();
    if (combined.includes('github')) {
      return { type: 'link', target: 'https://github.com/piyushkumar2025b', label: 'Open GitHub 🐙' };
    }
    if (combined.includes('linkedin')) {
      return { type: 'link', target: 'https://www.linkedin.com/in/piyush-kumar-74752b3a5/', label: 'Open LinkedIn 💼' };
    }
    if (combined.includes('leetcode')) {
      return { type: 'link', target: 'https://leetcode.com/u/Piyush_kumar_1392/', label: 'Open LeetCode 🏆' };
    }
    if (combined.includes('codeforces')) {
      return { type: 'link', target: 'https://codeforces.com/profile/piyush_kumar1392', label: 'Open Codeforces ⚔️' };
    }
    if (combined.includes('streamlit') || combined.includes('analytics workbench')) {
      return { type: 'link', target: 'https://share.streamlit.io/user/piyushkumar2025b-arch', label: 'Open Streamlit App 📊' };
    }
    if (combined.includes('education') || combined.includes('vit') || combined.includes('college')) {
      return { type: 'scroll', target: 'education', label: 'View Education 🎓' };
    }
    if (combined.includes('project') || combined.includes('work') || combined.includes('portfolio')) {
      return { type: 'scroll', target: 'projects', label: 'View Projects 🚀' };
    }
    if (combined.includes('contact') || combined.includes('hire') || combined.includes('email') || combined.includes('reach out')) {
      return { type: 'scroll', target: 'contact', label: 'Go to Contact Form 📬' };
    }
    if (combined.includes('skill') || combined.includes('tech stack') || combined.includes('tools')) {
      return { type: 'scroll', target: 'skills', label: 'Explore Skills ⚡' };
    }
    if (combined.includes('experience') || combined.includes('career') || combined.includes('resume')) {
      return { type: 'scroll', target: 'experience', label: 'See Experience 💼' };
    }
    if (combined.includes('about') || combined.includes('who is')) {
      return { type: 'scroll', target: 'about', label: 'Read Full Bio 👤' };
    }
    return undefined;
  }

  // Intelligent local domain-restricted knowledge engine
  private static generateLocalFallback(userMsg: string): { text: string; action?: ChatMessage['action'] } {
    const q = userMsg.toLowerCase().trim();

    // 1. Snorlax Pet Companion Interactions
    if (q.includes('who are you') || q.includes('snorlax') || q.includes('your name') || q.includes('what are you')) {
      return {
        text: `*Yaaawn... rubs eyes gently* 🐾 I'm Snorlax, Piyush Kumar's 3D companion pet! I watch over his portfolio website, take cozy power naps (Zzz...), snack on Sitrus Berries 🍓, and guide wonderful guests like you through Piyush's AI systems, 3D graphics, and software projects! ⚡`,
        action: { type: 'pet', target: 'berry', label: 'Feed Snorlax a Berry 🍓' },
      };
    }

    if (q.includes('sleep') || q.includes('nap') || q.includes('bed') || q.includes('zzz') || q.includes('snooze')) {
      return {
        text: `*Yaaawn... curling up comfortably* 💤 Ahh, my absolute favorite activity! You can click my snooze button anytime to let me rest, or poke me to wake me right back up! Zzz...`,
        action: { type: 'pet', target: 'sleep', label: 'Toggle Sleep Mode 💤' },
      };
    }

    if (q.includes('berry') || q.includes('feed') || q.includes('food') || q.includes('eat') || q.includes('snack')) {
      return {
        text: `*NOM NOM NOM!* 🍓 Sitrus Berry happily devoured! My belly is full, my smile is wider than ever, and my energy is recharged to 100%! (*happy tummy rumble*) Thank you!`,
        action: { type: 'pet', target: 'berry', label: 'Give another Berry 🍓' },
      };
    }

    if (q.includes('poke') || q.includes('pet') || q.includes('tickle') || q.includes('touch')) {
      return {
        text: `*Giggles & wiggles ears* 🐾 Hehehe that tickles! You can click or poke my 3D body anytime to see me bounce cheerfully! ✨`,
        action: { type: 'pet', target: 'berry', label: 'Feed Berry 🍓' },
      };
    }

    // 2. Greetings & Salutations
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ') || q === 'sup' || q.includes('good morning') || q.includes('good evening')) {
      return {
        text: `*Perks up ears cheerfully!* 🐾 Hello and welcome to Piyush Kumar's portfolio! I'm Snorlax, his 3D companion. I can answer anything about Piyush's B.Tech studies at VIT Chennai, his AI & full-stack projects, or how to contact him! What would you like to explore? 🍓⚡`,
        action: { type: 'scroll', target: 'projects', label: 'Explore Projects 🚀' },
      };
    }

    if (q.includes('bye') || q.includes('goodbye') || q.includes('see ya') || q.includes('good night') || q.includes('goodnight')) {
      return {
        text: `*Gentle sleepy wave* 💤 Thanks for visiting Piyush's portfolio! Come back anytime to check out new projects or send a message. Have an awesome day! 🐾✨`,
      };
    }

    // 3. Piyush Kumar - Identity & Bio
    if (
      q.includes('who is piyush') ||
      q.includes('tell me about piyush') ||
      q.includes('about piyush') ||
      q.includes('who built this') ||
      q.includes('who created this') ||
      q.includes('developer') ||
      q.includes('author') ||
      q.includes('tell me about yourself') ||
      q === 'about'
    ) {
      return {
        text: `*Perks up ears proudly!* ⚡ Piyush Kumar is a Computer Science student at VIT Chennai (B.Tech CSE Core, Semester 3) and an AI & Full-Stack Developer! He builds high-performance distributed systems, real-time 3D WebGL experiences with Three.js, and autonomous ML pipelines. He also loves fitness & strength training! 💪`,
        action: { type: 'scroll', target: 'about', label: 'Read Full About Section 👤' },
      };
    }

    // 4. Education & College (VIT Chennai)
    if (
      q.includes('education') ||
      q.includes('college') ||
      q.includes('university') ||
      q.includes('vit') ||
      q.includes('chennai') ||
      q.includes('degree') ||
      q.includes('btech') ||
      q.includes('b.tech') ||
      q.includes('semester') ||
      q.includes('sem') ||
      q.includes('study') ||
      q.includes('academics')
    ) {
      return {
        text: `🎓 Piyush is pursuing his **B.Tech in Computer Science & Engineering (Core)** at **Vellore Institute of Technology (VIT), Chennai** (Class of 2024 - 2028). He is currently in **Semester 3 (2nd Year)**, focusing on Data Structures & Algorithms, Object-Oriented Programming, and Intelligent Systems!`,
        action: { type: 'scroll', target: 'education', label: 'View Education 🎓' },
      };
    }

    // 5. Fitness & Hobbies
    if (
      q.includes('hobby') ||
      q.includes('hobbies') ||
      q.includes('gym') ||
      q.includes('fitness') ||
      q.includes('workout') ||
      q.includes('strength') ||
      q.includes('interest')
    ) {
      return {
        text: `🏋️‍♂️ Outside of coding, Piyush is deeply passionate about **Fitness & Strength Training**! He believes discipline in the gym fuels sharpness in software architecture. He also enjoys competitive programming, tech innovation, and open-source explorations!`,
        action: { type: 'scroll', target: 'about', label: 'Learn More About Piyush 📖' },
      };
    }

    // 6. Specific Projects
    // Streamlit AI Analytics
    if (q.includes('streamlit') || q.includes('analytics') || q.includes('data workbench') || q.includes('eda')) {
      return {
        text: `📊 **Streamlit AI Analytics & Data Workbench**: Piyush built an enterprise-grade ML data exploration suite delivering automated feature engineering, dataset anomaly detection, and predictive modeling with sub-100ms inference latency and interactive Plotly dashboards! Hosted live on Streamlit Cloud!`,
        action: { type: 'link', target: 'https://share.streamlit.io/user/piyushkumar2025b-arch', label: 'Open Streamlit Live App 🌐' },
      };
    }

    // Telegram Bot & Cloud Automation
    if (q.includes('telegram') || q.includes('bot') || q.includes('automation') || q.includes('orchestrator')) {
      return {
        text: `🤖 **Cloud Automation & Telegram Bot Engine**: An asynchronous task orchestrator engineered with Python AsyncIO, Docker, PostgreSQL, and Redis. It achieves 99.9% uptime with non-blocking event-driven webhook dispatching, scheduled monitors, and instant system telemetry alerts!`,
        action: { type: 'scroll', target: 'projects', label: 'See Telegram Bot Details 🚀' },
      };
    }

    // C++ Graph Engine
    if (q.includes('graph') || q.includes('c++') || q.includes('cpp') || q.includes('dijkstra') || q.includes('engine') || q.includes('low latency')) {
      return {
        text: `⚡ **High-Performance Algorithmic Graph Engine**: Built in Modern C++20, this computational suite features zero-allocation memory arena pooling for deterministic microsecond execution, cache-oblivious B-trees, lock-free queues, and SIMD parallel Dijkstra & A* pathfinding!`,
        action: { type: 'scroll', target: 'projects', label: 'View Graph Engine 📂' },
      };
    }

    // 3D Workstation & Visuals
    if (q.includes('3d') || q.includes('workstation') || q.includes('studio') || q.includes('rtx') || q.includes('oled') || q.includes('cat') || q.includes('webgl') || q.includes('shader')) {
      return {
        text: `🖥️ **Spatial 3D Developer Workstation & Studio**: Built with Three.js and WebGL 2.0! It features 60 FPS locked rendering, hardware 4x MSAA, ACES Filmic tone mapping, an Ultrawide curved OLED monitor with live system telemetry, an AIO liquid-cooled RTX 4090 rig with glowing coolant, and procedural Web Audio loops!`,
        action: { type: 'scroll', target: 'home', label: 'Back to 3D Scene 🌐' },
      };
    }

    // General Projects
    if (q.includes('project') || q.includes('build') || q.includes('portfolio') || q.includes('apps') || q.includes('work')) {
      return {
        text: `🚀 Piyush has engineered 4 major featured projects:
1. **Streamlit AI Analytics & Data Workbench** (ML & automated EDA, sub-100ms latency)
2. **Cloud Automation & Telegram Bot Engine** (Python AsyncIO, 99.9% uptime)
3. **High-Performance Algorithmic Graph Engine** (Modern C++20, zero-alloc memory arenas)
4. **Spatial 3D Developer Workstation** (Three.js WebGL 2.0, RTX 4090 studio, ACES Filmic)
Check them out with live demos and architecture highlights in the Projects section!`,
        action: { type: 'scroll', target: 'projects', label: 'Explore Projects 📂' },
      };
    }

    // 7. Skills, Tech Stack & Workbenches
    if (
      q.includes('skill') ||
      q.includes('tech') ||
      q.includes('stack') ||
      q.includes('language') ||
      q.includes('tools') ||
      q.includes('framework') ||
      q.includes('python') ||
      q.includes('javascript') ||
      q.includes('cursor') ||
      q.includes('docker')
    ) {
      return {
        text: `🛠️ Piyush's core arsenal includes:
• **Languages**: Python, C, C++, JavaScript, Java, HTML, SQL, JSON
• **AI & ML**: Gemini API, OpenRouter, Claude, DeepSeek, PyTorch, LangChain, RAG architectures
• **Frontend & 3D**: React, Three.js, WebGL, Tailwind CSS, Vite, Motion
• **Backend & Cloud**: Node.js, Express, FastAPI, PostgreSQL, Supabase, Docker, Kubernetes, Vercel, Railway
• **Workbenches Explored**: Google Colab, Cursor, Kiro, Google AI Studio, OpenCode, Claude Code, Streamlit, VS Code, Trae, Obsidian, Figma!`,
        action: { type: 'scroll', target: 'skills', label: 'View Full Skill Cloud ⚡' },
      };
    }

    // 8. Competitive Programming (LeetCode & Codeforces)
    if (
      q.includes('leetcode') ||
      q.includes('codeforces') ||
      q.includes('dsa') ||
      q.includes('competitive programming') ||
      q.includes('problem solving') ||
      q.includes('coding profile')
    ) {
      return {
        text: `🏆 Piyush actively practices algorithmic problem solving and competitive programming!
• **LeetCode**: https://leetcode.com/u/Piyush_kumar_1392/
• **Codeforces**: https://codeforces.com/profile/piyush_kumar1392
He excels at data structures, graph algorithms, dynamic programming, and systems optimization!`,
        action: { type: 'link', target: 'https://leetcode.com/u/Piyush_kumar_1392/', label: 'Open LeetCode Profile 🏆' },
      };
    }

    // 9. Contact, Hiring, & Collaboration
    if (
      q.includes('contact') ||
      q.includes('hire') ||
      q.includes('email') ||
      q.includes('message') ||
      q.includes('reach out') ||
      q.includes('collaborate') ||
      q.includes('internship') ||
      q.includes('job') ||
      q.includes('touch')
    ) {
      return {
        text: `📬 Piyush is open for software engineering internships, AI systems development, and innovative collaborations!
• **Email**: piyush.kumar2025b@vitstudent.ac.in
• **Contact Form**: Use the interactive form at the bottom of this page with instant confirmation receipt!
• **LinkedIn**: Connect with Piyush directly on LinkedIn!`,
        action: { type: 'scroll', target: 'contact', label: 'Go to Contact Form ✉️' },
      };
    }

    // 10. Social Profiles & Links
    if (q.includes('github') || q.includes('source code') || q.includes('repo')) {
      return {
        text: `🐙 Check out Piyush's open-source code and projects on GitHub: **https://github.com/piyushkumar2025b**!`,
        action: { type: 'link', target: 'https://github.com/piyushkumar2025b', label: 'Open GitHub Profile 🐙' },
      };
    }

    if (q.includes('linkedin') || q.includes('connect')) {
      return {
        text: `💼 Connect with Piyush on LinkedIn: **https://www.linkedin.com/in/piyush-kumar-74752b3a5/**!`,
        action: { type: 'link', target: 'https://www.linkedin.com/in/piyush-kumar-74752b3a5/', label: 'Open LinkedIn Profile 💼' },
      };
    }

    if (q.includes('instagram') || q.includes('insta')) {
      return {
        text: `📸 You can follow Piyush on Instagram: **@piyush._._._.kumar**!`,
        action: { type: 'link', target: 'https://www.instagram.com/piyush._._._.kumar', label: 'Open Instagram 📸' },
      };
    }

    // 11. Resume / CV
    if (q.includes('resume') || q.includes('cv') || q.includes('experience') || q.includes('career')) {
      return {
        text: `📄 Piyush is a B.Tech CSE student at VIT Chennai with hands-on expertise in Full-Stack, AI, and systems engineering. To request his full resume or discuss opportunities, you can message him directly through the contact section!`,
        action: { type: 'scroll', target: 'contact', label: 'Contact for Resume 📬' },
      };
    }

    // 12. Services & What He Does
    if (q.includes('service') || q.includes('what do you do') || q.includes('what can he do') || q.includes('offer')) {
      return {
        text: `⚡ Piyush offers expertise across 4 core engineering domains:
1. **Full-Stack Development**: Responsive web architectures with clean frontend & backend.
2. **AI & Machine Learning**: Smart automation pipelines, RAG systems, and model inference.
3. **Problem Solving & DSA**: Algorithmic optimization in C++, Python, and Java.
4. **API & Database Design**: Scalable relational architectures with SQL, Supabase, and PostgreSQL.`,
        action: { type: 'scroll', target: 'services', label: 'View Services Section 🛠️' },
      };
    }

    // 13. Website Design & Features
    if (
      q.includes('website') ||
      q.includes('site') ||
      q.includes('portfolio design') ||
      q.includes('how to navigate') ||
      q.includes('sections') ||
      q.includes('theme') ||
      q.includes('obsidian')
    ) {
      return {
        text: `✨ This portfolio is crafted with an "Obsidian Glass" aesthetic, neon cyan/emerald specular highlights, and high-performance WebGL 3D graphics!
Available sections:
• **Home (#home)**: 3D Developer Studio & spatial telemetry
• **About (#about)**: Piyush's background, VIT Chennai studies & fitness
• **Skills (#skills)**: Languages & explored AI workbenches
• **Services (#services)**: Core development offerings
• **Projects (#projects)**: 4 featured high-impact engineering projects
• **Education (#education)**: VIT Chennai B.Tech CSE details
• **Contact (#contact)**: Direct message dispatch with instant receipt!`,
        action: { type: 'scroll', target: 'projects', label: 'View Projects 🚀' },
      };
    }

    // 14. STRICT OFF-TOPIC REFUSAL (Ensures Snorlax ONLY chats about Piyush Kumar & his website!)
    const fallbackActions: Array<NonNullable<ChatMessage['action']>> = [
      { type: 'scroll', target: 'projects', label: 'Explore Piyush\'s Projects 🚀' },
      { type: 'scroll', target: 'skills', label: 'Explore Technical Skills ⚡' },
      { type: 'scroll', target: 'education', label: 'View Academic Journey 🎓' },
      { type: 'scroll', target: 'contact', label: 'Get in Touch Directly 📬' },
    ];
    const randomAction = fallbackActions[Math.floor(Math.random() * fallbackActions.length)];

    return {
      text: `*Yaaawn... stretches chubby paws* 💤 I only specialize in chatting about Piyush Kumar and his portfolio website! I would love to tell you about his AI projects, technical skills, his studies at VIT Chennai, or help you get in touch with him! What would you like to explore? 🍓🐾`,
      action: randomAction,
    };
  }
}
