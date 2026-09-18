import React, { useState, useEffect } from 'react';
import { initialPortfolioData } from './config/portfolioData';
import { PortfolioData, ProjectItem } from './types/portfolio';
import { PortfolioService } from './services/portfolioService';
import { ProjectService } from './services/projectService';
import { logFirebaseStatus } from './lib/firebase';
import { ENABLE_ADMIN_MODE } from './config/adminConfig';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SkillCloud } from './components/SkillCloud';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { AboutSection } from './components/AboutSection';
import { ExperienceSection } from './components/ExperienceSection';
import { EducationSection } from './components/EducationSection';
import { ResearchSection } from './components/ResearchSection';
import { AchievementsSection } from './components/AchievementsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminDashboard, AdminTab } from './components/admin/AdminDashboard';
import { BackToTop } from './components/ui/BackToTop';
import { InteractiveGridBackground } from './components/InteractiveGridBackground';
import { ToastNotification, ToastMessage } from './components/ui/ToastNotification';
import { Sliders } from 'lucide-react';
import { PortfolioEntranceManager } from './components/landing3d/PortfolioEntranceManager';
import { SnorlaxPetWidget } from './components/snorlax/SnorlaxPetWidget';
import { PublicDocumentModal } from './components/documents/PublicDocumentModal';
import { AuthService } from './services/authService';

export default function App() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(initialPortfolioData);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('profile');
  const [editingProjectTarget, setEditingProjectTarget] = useState<ProjectItem | null>(null);
  const [autoAddProject, setAutoAddProject] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    AuthService.getCurrentState().then((s) => setIsAdminAuthenticated(s.isAuthenticated && s.isAdmin));
    const unsubscribe = AuthService.onAuthStateChange((s) => setIsAdminAuthenticated(s.isAuthenticated && s.isAdmin));
    return () => unsubscribe();
  }, []);

  const handleOpenAdminTab = (tab: AdminTab, projectToEdit: ProjectItem | null = null, addProject: boolean = false) => {
    setAdminTab(tab);
    setEditingProjectTarget(projectToEdit);
    setAutoAddProject(addProject);
    setIsAdminDashboardOpen(true);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('portfolio-theme');
        if (savedTheme) {
          return savedTheme === 'dark';
        }
      } catch (e) {
        // localStorage not available or sandboxed
      }
    }
    return false; // Default to very light mode
  });

  // Synchronize document theme class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      try {
        localStorage.setItem('portfolio-theme', 'dark');
      } catch (e) {}
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      try {
        localStorage.setItem('portfolio-theme', 'light');
      } catch (e) {}
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Initial load
  useEffect(() => {
    logFirebaseStatus();
    async function loadData() {
      try {
        const result = await PortfolioService.getPortfolioData();
        if (result && result.data) {
          setPortfolioData(result.data);
        }
      } catch (err) {
        console.error('Failed to load portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Hash route listener for #admin or /admin (Only active if ENABLE_ADMIN_MODE is true in backend config)
  useEffect(() => {
    if (!ENABLE_ADMIN_MODE) return;

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (ENABLE_ADMIN_MODE && (hash === '#admin' || window.location.pathname === '/admin')) {
        setIsAdminDashboardOpen(true);
      }
      if (hash === '#documents' || hash === '#vault' || window.location.search.includes('documents=true')) {
        setIsDocumentsModalOpen(true);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut to toggle Admin Dashboard (Only active if ENABLE_ADMIN_MODE is true in backend config)
  useEffect(() => {
    if (!ENABLE_ADMIN_MODE) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminDashboardOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track active section for navbar highlighting with IntersectionObserver (zero layout thrashing)
  useEffect(() => {
    const sections = [
      'home', 
      'about',
      'skills',
      'services', 
      'projects', 
      'experience', 
      'education', 
      'research', 
      'achievements', 
      'contact'
    ];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0.05,
    });

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [portfolioData]);

  // Persist updates to storage & database with optional toast notification
  const handleDataChange = async (newData: PortfolioData, showToast = false) => {
    setPortfolioData(newData);
    await PortfolioService.savePortfolioData(newData);
    if (showToast) {
      setToast({
        id: Date.now().toString(),
        title: 'Portfolio Changes Saved',
        description: 'All configurations and content have been persisted securely.',
        type: 'success',
      });
    }
  };

  const handleUpdateProfileImage = async (newImageUrl: string) => {
    const updated: PortfolioData = {
      ...portfolioData,
      personal: {
        ...portfolioData.personal,
        profileImage: newImageUrl,
      },
    };
    setPortfolioData(updated);
    await PortfolioService.savePortfolioData(updated);
    await PortfolioService.updateProfileImageDirectly(newImageUrl);

    setToast({
      id: Date.now().toString(),
      title: 'Profile Photo Saved Permanently!',
      description: 'Saved to browser database (IndexedDB) & cloud. Your photo will remain when you reload the website.',
      avatarUrl: newImageUrl,
      type: 'success',
      duration: 5000,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const currentState = await AuthService.getCurrentState();
    if (!currentState.isAuthenticated || !currentState.isAdmin) {
      setToast({
        id: Date.now().toString(),
        title: 'Unauthorized Action',
        description: 'You must be authenticated as an administrator to delete projects.',
        type: 'error',
        duration: 5000,
      });
      return;
    }
    try {
      await ProjectService.deleteProject(projectId);
      const updatedProjects = portfolioData.projects.filter(p => p.id !== projectId);
      const updatedData: PortfolioData = {
        ...portfolioData,
        projects: updatedProjects,
      };
      setPortfolioData(updatedData);
      await PortfolioService.savePortfolioData(updatedData);
      setToast({
        id: Date.now().toString(),
        title: 'Project Deleted Permanently',
        description: 'The project, all comments, and its files have been removed from Supabase and the website.',
        type: 'success',
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setToast({
        id: Date.now().toString(),
        title: 'Error Deleting Project',
        description: err?.message || 'Could not delete project from Supabase.',
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateProject = async (updatedProject: ProjectItem) => {
    const updatedProjects = portfolioData.projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    const updatedData: PortfolioData = {
      ...portfolioData,
      projects: updatedProjects,
    };
    setPortfolioData(updatedData);
    await PortfolioService.savePortfolioData(updatedData);
  };

  // Filter navigation items dynamically based on visible sections and non-empty content
  const dynamicNavigation = portfolioData.navigation.filter(item => {
    if (item.href === '#home') return true;
    if (item.href === '#services') return portfolioData.visualSettings.showSectionServices;
    if (item.href === '#skills') return portfolioData.visualSettings.showSectionSkills;
    if (item.href === '#projects') return portfolioData.visualSettings.showSectionProjects;
    if (item.href === '#about') return portfolioData.visualSettings.showSectionAbout;
    if (item.href === '#experience') return portfolioData.visualSettings.showSectionExperience && portfolioData.experience.length > 0;
    if (item.href === '#education') return portfolioData.visualSettings.showSectionEducation && portfolioData.education.length > 0;
    if (item.href === '#research') return portfolioData.visualSettings.showSectionResearch && portfolioData.research.length > 0;
    if (item.href === '#achievements') return portfolioData.visualSettings.showSectionAchievements && portfolioData.achievements.length > 0;
    if (item.href === '#contact') return portfolioData.visualSettings.showSectionContact;
    return true;
  });

  return (
    <PortfolioEntranceManager>
      <div className="relative min-h-screen bg-[var(--portfolio-bg)] text-[var(--portfolio-text)] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-500/25 selection:text-emerald-300 transition-colors duration-300">
        
        {/* Subtle Layered Noise / Texture Overlay */}
        <div className="portfolio-noise" />

        {/* Minimal Interactive Perspective Grid */}
        <InteractiveGridBackground 
          enabled={portfolioData.visualSettings.enable3DEffects} 
          isDarkMode={isDarkMode}
        />

        {/* Layered ambient depth lighting */}
        <div className="fixed inset-0 bg-ambient-layered pointer-events-none -z-10" />

        {/* Main Navbar */}
        <Navbar
          navItems={dynamicNavigation}
          contactButton={portfolioData.heroButtons.primary}
          logoLetter={portfolioData.personal.firstName.charAt(0) || 'P'}
          activeSection={activeSection}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onOpenCustomizer={ENABLE_ADMIN_MODE ? () => handleOpenAdminTab('profile') : undefined}
          onOpenDocuments={() => setIsDocumentsModalOpen(true)}
        />

        {/* Main Content Sections */}
        <main>
          {/* 1. Hero Section */}
          <Hero
            personal={portfolioData.personal}
            heroButtons={portfolioData.heroButtons}
            socialLinks={portfolioData.socialLinks}
            visualSettings={portfolioData.visualSettings}
            onUpdateProfileImage={ENABLE_ADMIN_MODE ? handleUpdateProfileImage : undefined}
            onOpenDocuments={() => setIsDocumentsModalOpen(true)}
          />

          {/* 2. About Me Section (Background, Education, Passions & Philosophy) */}
          {portfolioData.visualSettings.showSectionAbout && (
            <AboutSection
              personal={portfolioData.personal}
              title={portfolioData.sectionHeaders.aboutTitle}
              subtitle={portfolioData.sectionHeaders.aboutSubtitle}
            />
          )}

          {/* 3. Technological Foundation (Skills) */}
          {portfolioData.visualSettings.showSectionSkills && (
            <SkillCloud
              title={portfolioData.sectionHeaders.skillsTitle}
              subtitle={portfolioData.sectionHeaders.skillsSubtitle}
              skills={portfolioData.skills}
            />
          )}

          {/* 4. Beyond Just Coding (Services) */}
          {portfolioData.visualSettings.showSectionServices && (
            <ServicesSection
              title={portfolioData.sectionHeaders.servicesTitle}
              subtitle={portfolioData.sectionHeaders.servicesSubtitle}
              services={portfolioData.services}
            />
          )}

          {/* 5. Featured Projects */}
          {portfolioData.visualSettings.showSectionProjects && (
            <ProjectsSection
              title={portfolioData.sectionHeaders.projectsTitle}
              subtitle={portfolioData.sectionHeaders.projectsSubtitle}
              projects={portfolioData.projects}
              enable3D={portfolioData.visualSettings.enable3DEffects}
              onOpenAddProject={isAdminAuthenticated ? () => handleOpenAdminTab('projects', null, true) : undefined}
              onEditProject={isAdminAuthenticated ? (p) => handleOpenAdminTab('projects', p, false) : undefined}
              onDeleteProject={isAdminAuthenticated ? handleDeleteProject : undefined}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {/* 6. Work Experience Section (Rendered only when real items exist) */}
          {portfolioData.visualSettings.showSectionExperience && portfolioData.experience.length > 0 && (
            <ExperienceSection
              title={portfolioData.sectionHeaders.experienceTitle}
              subtitle={portfolioData.sectionHeaders.experienceSubtitle}
              experiences={portfolioData.experience}
            />
          )}

          {/* 7. Education Section (Rendered only when real items exist) */}
          {portfolioData.visualSettings.showSectionEducation && portfolioData.education.length > 0 && (
            <EducationSection
              title={portfolioData.sectionHeaders.educationTitle}
              subtitle={portfolioData.sectionHeaders.educationSubtitle}
              education={portfolioData.education}
            />
          )}

          {/* 8. Research Publications (Rendered only when real items exist) */}
          {portfolioData.visualSettings.showSectionResearch && portfolioData.research.length > 0 && (
            <ResearchSection
              title={portfolioData.sectionHeaders.researchTitle}
              subtitle={portfolioData.sectionHeaders.researchSubtitle}
              research={portfolioData.research}
            />
          )}

          {/* 9. Achievements & Honors (Rendered only when real items exist) */}
          {portfolioData.visualSettings.showSectionAchievements && portfolioData.achievements.length > 0 && (
            <AchievementsSection
              title={portfolioData.sectionHeaders.achievementsTitle}
              subtitle={portfolioData.sectionHeaders.achievementsSubtitle}
              achievements={portfolioData.achievements}
            />
          )}

          {/* 10. Contact Section */}
          {portfolioData.visualSettings.showSectionContact && (
            <ContactSection
              title={portfolioData.sectionHeaders.contactTitle || portfolioData.contact.heading}
              subtitle={portfolioData.sectionHeaders.contactSubtitle || portfolioData.contact.description}
              personal={portfolioData.personal}
              onOpenAdmin={() => {
                handleOpenAdminTab('database');
              }}
            />
          )}
        </main>

        {/* Footer */}
        <Footer
          name={portfolioData.personal.name}
          title={portfolioData.personal.title}
          socialLinks={portfolioData.socialLinks}
          navItems={dynamicNavigation}
          logoLetter={portfolioData.personal.firstName.charAt(0) || 'P'}
          footerSettings={portfolioData.footer}
          onOpenDocuments={() => setIsDocumentsModalOpen(true)}
          onOpenDatabase={() => {
            handleOpenAdminTab('database');
          }}
        />

        {/* Floating Snorlax 3D Pet Companion & AI Guide */}
        <SnorlaxPetWidget />

        {/* Floating Smooth Back to Top */}
        <BackToTop threshold={400} />

        {/* Public Document Access Modal & Vault */}
        <PublicDocumentModal
          isOpen={isDocumentsModalOpen}
          isAdminMode={ENABLE_ADMIN_MODE}
          onClose={() => {
            setIsDocumentsModalOpen(false);
            if (window.location.hash === '#documents' || window.location.hash === '#vault') {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
          onToast={(title, description, type) => {
            setToast({
              id: Date.now().toString(),
              title,
              description,
              type: type || 'success',
            });
          }}
        />

        {/* Floating Admin Trigger Button (Only rendered when ENABLE_ADMIN_MODE is enabled in code) */}
        {ENABLE_ADMIN_MODE && (
          <div className="fixed bottom-20 left-6 z-40">
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              id="admin-dashboard-trigger"
              aria-label="Open portfolio admin dashboard"
              className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#101420]/95 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] transition-all duration-300 backdrop-blur-md text-[11px] font-bold cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-300" />
              <span>Edit Mode</span>
            </button>
          </div>
        )}

        {/* Production-Ready Admin Dashboard Controller (Only active when ENABLE_ADMIN_MODE is true) */}
        {ENABLE_ADMIN_MODE && (
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => {
              setIsAdminDashboardOpen(false);
              setAutoAddProject(false);
              setEditingProjectTarget(null);
              if (window.location.hash === '#admin') {
                window.history.pushState(null, '', window.location.pathname);
              }
            }}
            portfolioData={portfolioData}
            onUpdatePortfolioData={(updated) => handleDataChange(updated, true)}
            initialTab={adminTab}
            initialEditingProject={editingProjectTarget}
            autoAddProject={autoAddProject}
          />
        )}

        {/* Real-time Save & Update Notification */}
        <ToastNotification 
          toast={toast} 
          onClose={() => setToast(null)} 
        />

      </div>
    </PortfolioEntranceManager>
  );
}
