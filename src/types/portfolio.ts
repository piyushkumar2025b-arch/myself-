export interface NavItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
}

export type SocialPlatform = 
  | 'github' 
  | 'gmail' 
  | 'instagram' 
  | 'linkedin' 
  | 'codeforces' 
  | 'leetcode' 
  | 'streamlit'
  | 'huggingface'
  | 'twitter'
  | 'youtube'
  | 'discord'
  | 'custom';

export interface SocialLink {
  id: string;
  name: string;
  platform: SocialPlatform;
  url: string;
  iconName?: string;
  tooltip?: string;
  enabled: boolean;
  order: number;
  ariaLabel?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  icon?: string;
  category?: 'frontend' | 'backend' | 'languages' | 'devops' | 'ai' | 'tools' | 'workbenches' | 'other';
  color?: string;
  url?: string;
  enabled: boolean;
  order: number;
}

export interface ServiceCardItem {
  id: string;
  title: string;
  description: string;
  iconType: 'code' | 'ui' | 'database' | 'performance' | 'ai' | 'cloud' | 'mobile' | 'security';
  iconColor?: string;
  url?: string;
  enabled: boolean;
  order: number;
}

export type FileCategory = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'document' 
  | 'text' 
  | 'code' 
  | 'archive' 
  | 'data' 
  | 'other';

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  originalFileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number; // raw bytes
  compressedSize?: number; // compressed bytes in ZIP
  fileExtension: string;
  fileCategory: FileCategory;
  previewable: boolean;
  downloadable: boolean;
  displayOrder: number;
  publicUrl?: string;
  content?: string; // in-memory or text preview content
  createdAt: string;
  updatedAt: string;
}

export interface PublicDocument {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number; // in bytes
  fileExtension: string;
  mimeType: string;
  category: string; // e.g., 'Resume & CV', 'Research Papers', 'Guides & Notes', 'Cheat Sheets', 'Code & Datasets', 'Presentations', 'Other'
  storagePath: string;
  publicUrl: string;
  downloadCount: number;
  isPublic: boolean;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface ProjectComment {
  id: string;
  projectId: string;
  authorName: string;
  authorEmail: string; // Protected: never shown in public UI
  comment: string;
  content?: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectTechnology {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface ProjectItem {
  id: string;
  name?: string; // Internal project identifier (e.g. "AI News Ingestion Platform")
  displayTitle?: string; // Visual title for public cards & detail modal
  title: string; // Backwards compatible fallback title
  slug?: string;
  shortDescription: string;
  longDescription?: string;
  fullDescription?: string; // Alias for longDescription
  coverImage: string;
  previewImagePath?: string; // Supabase Storage path: project-assets/{id}/preview/...
  previewImageUrl?: string;
  gallery?: string[];
  technologies: string[];
  category: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  caseStudyUrl?: string;
  paperUrl?: string;
  status?: 'Completed' | 'In Progress' | 'Featured' | 'Archived';
  date?: string;
  featured: boolean;
  enabled: boolean;
  order: number;
  // Project ZIP Archive metadata
  zipStoragePath?: string; // Storage path: project-files/{id}/archives/...
  zipFileName?: string;
  zipFileSize?: number; // bytes
  zipUpdatedAt?: string;
  // Relational sub-entities
  files?: ProjectFile[];
  comments?: ProjectComment[];
  highlights?: string[];
  highlightStats?: { label: string; value: string }[];
  telemetryStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperienceItem {
  id: string;
  organization: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description: string[];
  technologies?: string[];
  companyUrl?: string;
  logo?: string;
  enabled: boolean;
  order: number;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
  logo?: string;
  url?: string;
  enabled: boolean;
  order: number;
}

export interface ResearchItem {
  id: string;
  title: string;
  authors?: string;
  venue?: string;
  date?: string;
  url?: string;
  pdfUrl?: string;
  doi?: string;
  description?: string;
  enabled: boolean;
  order: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
  url?: string;
  enabled: boolean;
  order: number;
}

export interface PersonalInfo {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  subtitle?: string;
  shortDescription: string;
  longDescription?: string;
  aboutIntro?: string;
  college?: string;
  degree?: string;
  semester?: string;
  city?: string;
  state?: string;
  location?: string;
  professionalAt?: string[];
  hobbies?: string[];
  availabilityText: string;
  isAvailable: boolean;
  profileImage: string;
  resumeUrl: string; // real CV/resume URL; if empty or '#', CV CTA button is hidden
  email: string;
  phone?: string;
}

export interface CTAButton {
  id: string;
  text: string;
  link: string;
  icon?: 'arrow-right' | 'download' | 'mail' | 'external' | 'none';
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  enabled: boolean;
}

export interface SectionHeaders {
  skillsTitle: string;
  skillsSubtitle: string;
  servicesTitle: string;
  servicesSubtitle: string;
  projectsTitle: string;
  projectsSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  experienceTitle: string;
  experienceSubtitle: string;
  educationTitle: string;
  educationSubtitle: string;
  researchTitle: string;
  researchSubtitle: string;
  achievementsTitle: string;
  achievementsSubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
}

export interface VisualSettings {
  enable3DEffects: boolean;
  enableAnimations: boolean;
  glowIntensity: 'subtle' | 'vibrant' | 'minimal';
  showProfileVisual: boolean;
  showSectionAbout: boolean;
  showSectionExperience: boolean;
  showSectionEducation: boolean;
  showSectionResearch: boolean;
  showSectionAchievements: boolean;
  showSectionProjects: boolean;
  showSectionSkills: boolean;
  showSectionServices: boolean;
  showSectionContact: boolean;
}

export interface ContactSettings {
  heading: string;
  description: string;
  email: string;
  phone?: string;
  location?: string;
  formEnabled: boolean;
}

export interface FooterSettings {
  copyrightText: string;
  statusText: string;
  showBackToTop: boolean;
}

export interface PortfolioData {
  personal: PersonalInfo;
  heroButtons: {
    primary: CTAButton;
    secondary: CTAButton;
  };
  navigation: NavItem[];
  socialLinks: SocialLink[];
  sectionHeaders: SectionHeaders;
  skills: SkillItem[];
  services: ServiceCardItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  research: ResearchItem[];
  achievements: AchievementItem[];
  contact: ContactSettings;
  footer: FooterSettings;
  visualSettings: VisualSettings;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
}

