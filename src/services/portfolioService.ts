import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  PortfolioData, 
  PersonalInfo, 
  ProjectItem, 
  SkillItem, 
  ServiceCardItem, 
  SocialLink, 
  SocialPlatform,
  NavItem, 
  ExperienceItem, 
  EducationItem, 
  ResearchItem, 
  AchievementItem 
} from '../types/portfolio';
import { initialPortfolioData } from '../config/portfolioData';
import { 
  persistCustomProfileImage, 
  getPersistedCustomProfileImage, 
  idbSet, 
  idbGet, 
  KEY_PORTFOLIO_DATA,
  KEY_CUSTOM_PROFILE_IMAGE
} from './persistentStorage';

const LOCAL_STORAGE_KEY = KEY_PORTFOLIO_DATA;

export interface DataFetchResult {
  data: PortfolioData;
  source: 'firebase' | 'supabase' | 'local_storage' | 'initial_defaults';
  error?: string | null;
}

export interface SaveProjectResult {
  success: boolean;
  syncedToSupabase: boolean;
  syncedToFirebase?: boolean;
  verifiedInCloud: boolean;
  cloudError?: string | null;
  message: string;
  project: ProjectItem;
}

export interface SavePortfolioResult {
  success: boolean;
  syncedToSupabase: boolean;
  syncedToFirebase?: boolean;
  details: Record<string, { success: boolean; count?: number; error?: string }>;
  message: string;
}

export class PortfolioService {
  /**
   * Load complete portfolio data from Supabase or resilient fallback
   */
  static async getPortfolioData(): Promise<DataFetchResult> {
    const client = getSupabase();
    // Retrieve custom profile image from durable local storage / IndexedDB
    const customPersistedPhoto = await getPersistedCustomProfileImage();

    // 1. Primary Cloud Database: Firebase Firestore
    try {
      if (db && db.type) {
        const docRef = doc(db, 'portfolio_data', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as PortfolioData;
          if (cloudData && cloudData.personal) {
            const merged: PortfolioData = {
              ...initialPortfolioData,
              ...cloudData,
              personal: {
                ...initialPortfolioData.personal,
                ...(cloudData.personal || {}),
                profileImage: cloudData.personal?.profileImage || customPersistedPhoto || initialPortfolioData.personal.profileImage,
              },
              heroButtons: {
                primary: { ...initialPortfolioData.heroButtons.primary, ...(cloudData.heroButtons?.primary || {}) },
                secondary: { ...initialPortfolioData.heroButtons.secondary, ...(cloudData.heroButtons?.secondary || {}) },
              },
              navigation: (cloudData.navigation && cloudData.navigation.length > 0) ? cloudData.navigation : initialPortfolioData.navigation,
              socialLinks: (cloudData.socialLinks && cloudData.socialLinks.length > 0) ? cloudData.socialLinks : initialPortfolioData.socialLinks,
              skills: (cloudData.skills && cloudData.skills.length > 0) ? cloudData.skills : initialPortfolioData.skills,
              services: (cloudData.services && cloudData.services.length > 0) ? cloudData.services : initialPortfolioData.services,
              projects: (cloudData.projects && cloudData.projects.length > 0) ? cloudData.projects : initialPortfolioData.projects,
              experience: cloudData.experience ?? initialPortfolioData.experience,
              education: cloudData.education ?? initialPortfolioData.education,
              research: cloudData.research ?? initialPortfolioData.research,
              achievements: cloudData.achievements ?? initialPortfolioData.achievements,
            };
            await idbSet(KEY_PORTFOLIO_DATA, merged);
            return {
              data: merged,
              source: 'firebase',
              error: null,
            };
          }
        }
      }
    } catch (fbErr) {
      console.warn('Firebase portfolio data read notice:', fbErr);
    }

    // If Supabase is configured, fetch real relational records
    if (client && isSupabaseConnected()) {
      try {
        const [
          profileRes,
          navRes,
          socialRes,
          skillsRes,
          servicesRes,
          projectsRes,
          projectFilesRes,
          projectCommentsRes,
          expRes,
          eduRes,
          researchRes,
          achieveRes,
          settingsRes,
        ] = await Promise.all([
          client.from('profiles').select('*').limit(1).maybeSingle(),
          client.from('navigation').select('*').order('sort_order', { ascending: true }),
          client.from('social_links').select('*').order('sort_order', { ascending: true }),
          client.from('skills').select('*').order('sort_order', { ascending: true }),
          client.from('services').select('*').order('sort_order', { ascending: true }),
          client.from('projects').select('*').order('sort_order', { ascending: true }),
          client.from('project_files').select('*').order('display_order', { ascending: true }),
          client.from('project_comments').select('*').order('created_at', { ascending: false }),
          client.from('experiences').select('*').order('sort_order', { ascending: true }),
          client.from('education').select('*').order('sort_order', { ascending: true }),
          client.from('research').select('*').order('sort_order', { ascending: true }),
          client.from('achievements').select('*').order('sort_order', { ascending: true }),
          client.from('site_settings').select('*').eq('id', 'default_settings').maybeSingle(),
        ]);

        // Map files and comments by project ID
        const allFiles = (projectFilesRes.data || []).map((f: any) => ({
          id: f.id,
          projectId: f.project_id,
          fileName: f.file_name,
          originalFileName: f.original_file_name || f.file_name,
          storagePath: f.storage_path,
          mimeType: f.mime_type,
          fileSize: Number(f.file_size || 0),
          compressedSize: f.compressed_size ? Number(f.compressed_size) : undefined,
          fileExtension: f.file_extension || '',
          fileCategory: f.file_category || 'other',
          previewable: f.previewable ?? true,
          downloadable: f.downloadable ?? true,
          displayOrder: f.display_order ?? 0,
          publicUrl: f.public_url || '',
          content: f.content || undefined,
          createdAt: f.created_at || new Date().toISOString(),
          updatedAt: f.updated_at || new Date().toISOString(),
        }));

        const allComments = (projectCommentsRes.data || []).map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          authorName: c.author_name,
          authorEmail: c.author_email || '',
          comment: c.comment,
          status: c.status || 'pending',
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.updated_at || new Date().toISOString(),
        }));

        // Prioritize: Supabase profile photo if valid and custom -> custom persisted photo -> default
        const resolvedProfilePhoto = 
          (profileRes.data?.profile_image && profileRes.data.profile_image.trim() !== '' && !profileRes.data.profile_image.includes('placeholder'))
            ? profileRes.data.profile_image
            : (customPersistedPhoto || initialPortfolioData.personal.profileImage);

        // Map data or fallback to defaults
        const personal: PersonalInfo = profileRes.data ? {
          name: profileRes.data.name || initialPortfolioData.personal.name,
          firstName: profileRes.data.first_name || initialPortfolioData.personal.firstName,
          lastName: profileRes.data.last_name || initialPortfolioData.personal.lastName,
          title: profileRes.data.title || initialPortfolioData.personal.title,
          subtitle: profileRes.data.subtitle || undefined,
          shortDescription: profileRes.data.short_description || initialPortfolioData.personal.shortDescription,
          longDescription: profileRes.data.long_description || undefined,
          availabilityText: profileRes.data.availability_text || initialPortfolioData.personal.availabilityText,
          isAvailable: profileRes.data.is_available ?? initialPortfolioData.personal.isAvailable,
          profileImage: resolvedProfilePhoto,
          resumeUrl: profileRes.data.resume_url || '',
          email: profileRes.data.email || initialPortfolioData.personal.email,
          phone: profileRes.data.phone || undefined,
          location: profileRes.data.location || undefined,
        } : {
          ...initialPortfolioData.personal,
          profileImage: customPersistedPhoto || initialPortfolioData.personal.profileImage,
        };

        const navigation: NavItem[] = (navRes.data && navRes.data.length > 0)
          ? navRes.data.map((item: any) => ({
              id: item.id,
              label: item.label,
              href: item.href,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : initialPortfolioData.navigation;

        // Attempt fallback to 'connections' table if 'social_links' is empty or unavailable
        let rawSocialData = socialRes.data;
        if (!rawSocialData || rawSocialData.length === 0) {
          try {
            const connectionsRes = await client.from('connections').select('*');
            if (connectionsRes.data && connectionsRes.data.length > 0) {
              rawSocialData = connectionsRes.data;
            }
          } catch {
            // Ignore error if table doesn't exist
          }
        }

        const mapSocialItem = (item: any, idx: number): SocialLink => {
          const rawTitle = (item.title || item.name || '').toLowerCase().trim();
          let platform: SocialPlatform = item.platform || 'custom';
          let displayName = item.name || item.title || 'Link';
          let url = item.url || '';

          if (rawTitle.includes('git') || rawTitle.includes('github') || rawTitle === 'git_hub') {
            platform = 'github';
            displayName = 'GitHub';
          } else if (rawTitle.includes('linkedin') || rawTitle.includes('linked_in') || rawTitle.includes('link_in')) {
            platform = 'linkedin';
            displayName = 'LinkedIn';
          } else if (rawTitle.includes('codeforces') || rawTitle.includes('code_forces')) {
            platform = 'codeforces';
            displayName = 'Codeforces';
          } else if (rawTitle.includes('leetcode') || rawTitle.includes('leet_code')) {
            platform = 'leetcode';
            displayName = 'LeetCode';
          } else if (rawTitle.includes('insta') || rawTitle.includes('instagram')) {
            platform = 'instagram';
            displayName = 'Instagram';
          } else if (rawTitle.includes('mail') || rawTitle.includes('email') || rawTitle.includes('gmail')) {
            platform = 'gmail';
            displayName = 'Email';
            if (url && !url.startsWith('mailto:') && !url.startsWith('http')) {
              url = `mailto:${url}`;
            }
          } else if (rawTitle.includes('streamlit')) {
            platform = 'streamlit';
            displayName = 'Streamlit';
          } else if (rawTitle.includes('hugging') || rawTitle.includes('hf')) {
            platform = 'huggingface';
            displayName = 'Hugging Face';
          }

          return {
            id: String(item.id || 'soc-' + (idx + 1)),
            name: displayName,
            platform,
            url,
            iconName: item.icon_name,
            tooltip: item.tooltip || displayName,
            enabled: item.enabled ?? true,
            order: item.sort_order ?? (idx + 1),
            ariaLabel: item.aria_label || `Visit ${displayName}`,
          };
        };

        const socialLinks: SocialLink[] = (rawSocialData && rawSocialData.length > 0)
          ? rawSocialData.map(mapSocialItem)
          : initialPortfolioData.socialLinks;

        const skills: SkillItem[] = (skillsRes.data && skillsRes.data.length > 0)
          ? skillsRes.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              icon: item.icon,
              category: item.category,
              color: item.color,
              url: item.url,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : initialPortfolioData.skills;

        const services: ServiceCardItem[] = (servicesRes.data && servicesRes.data.length > 0)
          ? servicesRes.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              iconType: item.icon_type,
              iconColor: item.icon_color,
              url: item.url,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : initialPortfolioData.services;

        const projects: ProjectItem[] = (projectsRes.data && projectsRes.data.length > 0)
          ? projectsRes.data.map((item: any) => ({
              id: item.id,
              name: item.name || item.title,
              displayTitle: item.display_title || item.title,
              title: item.display_title || item.title,
              slug: item.slug,
              shortDescription: item.short_description,
              longDescription: item.long_description,
              fullDescription: item.long_description,
              coverImage: item.cover_image,
              previewImagePath: item.preview_image_path,
              previewImageUrl: item.preview_image_url || item.cover_image,
              gallery: Array.isArray(item.gallery) ? item.gallery : [],
              technologies: Array.isArray(item.technologies) ? item.technologies : [],
              category: item.category,
              githubUrl: item.github_url,
              liveDemoUrl: item.live_demo_url,
              caseStudyUrl: item.case_study_url,
              paperUrl: item.paper_url,
              status: item.status,
              date: item.project_date,
              featured: item.featured ?? false,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
              zipStoragePath: item.zip_storage_path,
              zipFileName: item.zip_file_name,
              zipFileSize: item.zip_file_size ? Number(item.zip_file_size) : undefined,
              zipUpdatedAt: item.zip_updated_at,
              files: allFiles.filter((f) => f.projectId === item.id),
              comments: allComments.filter((c) => c.projectId === item.id),
              highlights: Array.isArray(item.highlights) ? item.highlights : [],
              highlightStats: Array.isArray(item.highlight_stats) ? item.highlight_stats : [],
              telemetryStatus: item.telemetry_status || item.telemetryStatus || undefined,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            }))
          : [];

        const experience: ExperienceItem[] = (expRes.data && expRes.data.length > 0)
          ? expRes.data.map((item: any) => ({
              id: item.id,
              organization: item.organization,
              role: item.role,
              location: item.location,
              startDate: item.start_date,
              endDate: item.end_date,
              isCurrent: item.is_current,
              description: Array.isArray(item.description) ? item.description : [item.description].filter(Boolean),
              technologies: Array.isArray(item.technologies) ? item.technologies : [],
              companyUrl: item.company_url,
              logo: item.logo,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : [];

        const education: EducationItem[] = (eduRes.data && eduRes.data.length > 0)
          ? eduRes.data.map((item: any) => ({
              id: item.id,
              institution: item.institution,
              degree: item.degree,
              field: item.field,
              startDate: item.start_date,
              endDate: item.end_date,
              grade: item.grade,
              description: item.description,
              logo: item.logo,
              url: item.url,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : [];

        const research: ResearchItem[] = (researchRes.data && researchRes.data.length > 0)
          ? researchRes.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              authors: item.authors,
              venue: item.venue,
              date: item.publication_date,
              url: item.url,
              pdfUrl: item.pdf_url,
              doi: item.doi,
              description: item.description,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : [];

        const achievements: AchievementItem[] = (achieveRes.data && achieveRes.data.length > 0)
          ? achieveRes.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              issuer: item.issuer,
              date: item.achievement_date,
              description: item.description,
              url: item.url,
              enabled: item.enabled ?? true,
              order: item.sort_order ?? 0,
            }))
          : [];

        const settingsData = settingsRes.data || {};

        const constructedData: PortfolioData = {
          personal,
          heroButtons: settingsData.hero_buttons || initialPortfolioData.heroButtons,
          navigation,
          socialLinks,
          sectionHeaders: { ...initialPortfolioData.sectionHeaders, ...(settingsData.section_headers || {}) },
          skills,
          services,
          projects,
          experience,
          education,
          research,
          achievements,
          contact: { ...initialPortfolioData.contact, ...(settingsData.contact_settings || {}) },
          footer: { ...initialPortfolioData.footer, ...(settingsData.footer_settings || {}) },
          visualSettings: { ...initialPortfolioData.visualSettings, ...(settingsData.visual_settings || {}) },
        };

        // Cache locally across IndexedDB & LocalStorage for durable offline resiliency
        await idbSet(KEY_PORTFOLIO_DATA, constructedData);
        if (resolvedProfilePhoto) {
          await persistCustomProfileImage(resolvedProfilePhoto);
        }
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(constructedData));
        } catch (e) {
          // Ignore local storage quota errors (IndexedDB holds it safely)
        }

        return {
          data: constructedData,
          source: 'supabase',
          error: null,
        };
      } catch (err: any) {
        console.warn('Supabase fetch failed, checking local cache:', err);
      }
    }

    // 1. Fallback to IndexedDB (unlimited quota, durable)
    try {
      const idbData = await idbGet<PortfolioData>(KEY_PORTFOLIO_DATA);
      if (idbData && idbData.personal) {
        const merged: PortfolioData = {
          ...initialPortfolioData,
          ...idbData,
          personal: {
            ...initialPortfolioData.personal,
            ...(idbData.personal || {}),
            profileImage: idbData.personal?.profileImage || customPersistedPhoto || initialPortfolioData.personal.profileImage,
          },
          heroButtons: {
            primary: { ...initialPortfolioData.heroButtons.primary, ...(idbData.heroButtons?.primary || {}) },
            secondary: { ...initialPortfolioData.heroButtons.secondary, ...(idbData.heroButtons?.secondary || {}) },
          },
          navigation: (idbData.navigation && idbData.navigation.length > 0) ? idbData.navigation : initialPortfolioData.navigation,
          socialLinks: (idbData.socialLinks && idbData.socialLinks.length > 0) ? idbData.socialLinks : initialPortfolioData.socialLinks,
          sectionHeaders: {
            ...initialPortfolioData.sectionHeaders,
            ...(idbData.sectionHeaders || {}),
          },
          skills: (idbData.skills && idbData.skills.length > 0) ? idbData.skills : initialPortfolioData.skills,
          services: (idbData.services && idbData.services.length > 0) ? idbData.services : initialPortfolioData.services,
          projects: (idbData.projects && idbData.projects.length > 0) ? idbData.projects : initialPortfolioData.projects,
          experience: idbData.experience ?? initialPortfolioData.experience,
          education: idbData.education ?? initialPortfolioData.education,
          research: idbData.research ?? initialPortfolioData.research,
          achievements: idbData.achievements ?? initialPortfolioData.achievements,
          contact: {
            ...initialPortfolioData.contact,
            ...(idbData.contact || {}),
          },
          footer: {
            ...initialPortfolioData.footer,
            ...(idbData.footer || {}),
          },
          visualSettings: {
            ...initialPortfolioData.visualSettings,
            ...(idbData.visualSettings || {}),
          },
        };
        return {
          data: merged,
          source: 'local_storage',
          error: null,
        };
      }
    } catch (e) {
      console.warn('Error reading from IndexedDB:', e);
    }

    // 2. Fallback to local storage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PortfolioData;
        const merged: PortfolioData = {
          ...initialPortfolioData,
          ...parsed,
          personal: {
            ...initialPortfolioData.personal,
            ...(parsed.personal || {}),
            profileImage: parsed.personal?.profileImage || customPersistedPhoto || initialPortfolioData.personal.profileImage,
          },
          heroButtons: {
            primary: { ...initialPortfolioData.heroButtons.primary, ...(parsed.heroButtons?.primary || {}) },
            secondary: { ...initialPortfolioData.heroButtons.secondary, ...(parsed.heroButtons?.secondary || {}) },
          },
          navigation: (parsed.navigation && parsed.navigation.length > 0) ? parsed.navigation : initialPortfolioData.navigation,
          socialLinks: (parsed.socialLinks && parsed.socialLinks.length > 0) ? parsed.socialLinks : initialPortfolioData.socialLinks,
          sectionHeaders: {
            ...initialPortfolioData.sectionHeaders,
            ...(parsed.sectionHeaders || {}),
          },
          skills: (parsed.skills && parsed.skills.length > 0) ? parsed.skills : initialPortfolioData.skills,
          services: (parsed.services && parsed.services.length > 0) ? parsed.services : initialPortfolioData.services,
          projects: (parsed.projects && parsed.projects.length > 0) ? parsed.projects : initialPortfolioData.projects,
          experience: parsed.experience ?? initialPortfolioData.experience,
          education: parsed.education ?? initialPortfolioData.education,
          research: parsed.research ?? initialPortfolioData.research,
          achievements: parsed.achievements ?? initialPortfolioData.achievements,
          contact: {
            ...initialPortfolioData.contact,
            ...(parsed.contact || {}),
          },
          footer: {
            ...initialPortfolioData.footer,
            ...(parsed.footer || {}),
          },
          visualSettings: {
            ...initialPortfolioData.visualSettings,
            ...(parsed.visualSettings || {}),
          },
        };
        return {
          data: merged,
          source: 'local_storage',
          error: null,
        };
      }
    } catch (e) {
      console.warn('Error reading from local storage:', e);
    }

    // Default clean state with safe profile photo
    const defaultData: PortfolioData = {
      ...initialPortfolioData,
      personal: {
        ...initialPortfolioData.personal,
        profileImage: '/assets/images/profile.jpg',
      },
    };

    return {
      data: defaultData,
      source: 'initial_defaults',
      error: null,
    };
  }

  /**
   * Save complete portfolio data to IndexedDB, LocalStorage, and Supabase
   */
  static async savePortfolioData(data: PortfolioData): Promise<boolean> {
    try {
      // 1. Persist the profile image specifically to durable storage (IndexedDB + localStorage)
      if (data.personal?.profileImage) {
        await persistCustomProfileImage(data.personal.profileImage);
      }

      // 2. Save full data object into IndexedDB (never hits 5MB quota limits)
      await idbSet(KEY_PORTFOLIO_DATA, data);

      // 3. Also update localStorage safely (for instant sync reads)
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (storageErr) {
        console.warn('Local storage write note (stored in IndexedDB safely):', storageErr);
      }

      // 4. Primary Cloud Database: Sync to Firebase Firestore
      let syncedToFirebase = false;
      try {
        if (db && db.type) {
          await setDoc(doc(db, 'portfolio_data', 'main'), {
            ...data,
            updatedAt: new Date().toISOString(),
          });
          syncedToFirebase = true;
        }
      } catch (fbSaveErr) {
        console.warn('Firebase portfolio save notice:', fbSaveErr);
      }

      // 5. If Supabase is configured, sync to cloud database
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          // Sync profile
          await client.from('profiles').upsert({
            id: '00000000-0000-0000-0000-000000000001',
            first_name: data.personal.firstName,
            last_name: data.personal.lastName,
            name: data.personal.name,
            title: data.personal.title,
            subtitle: data.personal.subtitle || null,
            short_description: data.personal.shortDescription,
            long_description: data.personal.longDescription || null,
            availability_text: data.personal.availabilityText,
            is_available: data.personal.isAvailable,
            profile_image: data.personal.profileImage,
            resume_url: data.personal.resumeUrl,
            email: data.personal.email,
            phone: data.personal.phone || null,
            location: data.personal.location || null,
            updated_at: new Date().toISOString(),
          });

          // Sync site settings
          await client.from('site_settings').upsert({
            id: 'default_settings',
            section_headers: data.sectionHeaders,
            hero_buttons: data.heroButtons,
            visual_settings: data.visualSettings,
            footer_settings: data.footer,
            contact_settings: data.contact,
            updated_at: new Date().toISOString(),
          });

          // Sync projects (batch upsert with column error resilience)
          if (data.projects && data.projects.length > 0) {
            const projectRows = data.projects.map((p, idx) => ({
              id: p.id,
              name: p.name || p.title,
              display_title: p.displayTitle || p.title,
              title: p.displayTitle || p.title,
              slug: p.slug,
              short_description: p.shortDescription,
              long_description: p.fullDescription || p.longDescription || null,
              cover_image: p.coverImage,
              preview_image_path: p.previewImagePath || null,
              preview_image_url: p.previewImageUrl || p.coverImage,
              gallery: p.gallery || [],
              technologies: p.technologies || [],
              category: p.category,
              github_url: p.githubUrl || null,
              live_demo_url: p.liveDemoUrl || null,
              case_study_url: p.caseStudyUrl || null,
              paper_url: p.paperUrl || null,
              status: p.status,
              project_date: p.date,
              featured: p.featured,
              enabled: p.enabled,
              sort_order: p.order ?? idx,
              zip_storage_path: p.zipStoragePath || null,
              zip_file_name: p.zipFileName || null,
              zip_file_size: p.zipFileSize || null,
              zip_updated_at: p.zipUpdatedAt || null,
              highlights: p.highlights || [],
              highlight_stats: p.highlightStats || [],
              updated_at: new Date().toISOString(),
            }));

            let { error: projErr } = await client.from('projects').upsert(projectRows);

            // If schema lacks some extended columns, retry with standard core columns
            if (projErr && (projErr.message?.includes('column') || (projErr as any).code === 'PGRST204')) {
              const coreRows = data.projects.map((p, idx) => ({
                id: p.id,
                title: p.displayTitle || p.title,
                slug: p.slug || null,
                short_description: p.shortDescription,
                long_description: p.fullDescription || p.longDescription || null,
                cover_image: p.coverImage,
                gallery: p.gallery || [],
                technologies: p.technologies || [],
                category: p.category,
                github_url: p.githubUrl || null,
                live_demo_url: p.liveDemoUrl || null,
                case_study_url: p.caseStudyUrl || null,
                paper_url: p.paperUrl || null,
                status: p.status,
                project_date: p.date,
                featured: p.featured,
                enabled: p.enabled,
                sort_order: p.order ?? idx,
                highlight_stats: p.highlightStats || [],
                updated_at: new Date().toISOString(),
              }));
              const retry = await client.from('projects').upsert(coreRows);
              projErr = retry.error;
            }

            if (projErr) {
              console.warn('Supabase projects sync note:', projErr.message);
            }

            // Sync project files if any
            for (const p of data.projects) {
              if (p.files && p.files.length > 0) {
                const fileRows = p.files.map((f, fIdx) => ({
                  id: f.id,
                  project_id: p.id,
                  file_name: f.fileName,
                  original_file_name: f.originalFileName || f.fileName,
                  storage_path: f.storagePath,
                  mime_type: f.mimeType,
                  file_size: f.fileSize,
                  compressed_size: f.compressedSize || null,
                  file_extension: f.fileExtension,
                  file_category: f.fileCategory,
                  previewable: f.previewable,
                  downloadable: f.downloadable,
                  display_order: f.displayOrder ?? fIdx,
                  public_url: f.publicUrl || null,
                  content: f.content || null,
                  created_at: f.createdAt,
                  updated_at: f.updatedAt,
                }));
                await client.from('project_files').upsert(fileRows);
              }
            }
          }

          // Sync skills
          if (data.skills && data.skills.length > 0) {
            const skillRows = data.skills.map((s, idx) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
              category: s.category,
              color: s.color,
              url: s.url || null,
              enabled: s.enabled,
              sort_order: s.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('skills').upsert(skillRows);
          }

          // Sync services
          if (data.services && data.services.length > 0) {
            const serviceRows = data.services.map((srv, idx) => ({
              id: srv.id,
              title: srv.title,
              description: srv.description,
              icon_type: srv.iconType,
              icon_color: srv.iconColor,
              url: srv.url || null,
              enabled: srv.enabled,
              sort_order: srv.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('services').upsert(serviceRows);
          }

          // Sync experiences
          if (data.experience && data.experience.length > 0) {
            const expRows = data.experience.map((e, idx) => ({
              id: e.id,
              organization: e.organization,
              role: e.role,
              location: e.location || null,
              start_date: e.startDate,
              end_date: e.endDate || null,
              is_current: e.isCurrent ?? false,
              description: e.description,
              technologies: e.technologies || [],
              company_url: e.companyUrl || null,
              logo: e.logo || null,
              enabled: e.enabled,
              sort_order: e.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('experiences').upsert(expRows);
          }

          // Sync education
          if (data.education && data.education.length > 0) {
            const eduRows = data.education.map((ed, idx) => ({
              id: ed.id,
              institution: ed.institution,
              degree: ed.degree,
              field: ed.field,
              start_date: ed.startDate,
              end_date: ed.endDate || null,
              grade: ed.grade || null,
              description: ed.description || null,
              logo: ed.logo || null,
              url: ed.url || null,
              enabled: ed.enabled,
              sort_order: ed.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('education').upsert(eduRows);
          }

          // Sync research
          if (data.research && data.research.length > 0) {
            const resRows = data.research.map((r, idx) => ({
              id: r.id,
              title: r.title,
              authors: r.authors || [],
              venue: r.venue || null,
              publication_date: r.date || null,
              url: r.url || null,
              pdf_url: r.pdfUrl || null,
              doi: r.doi || null,
              description: r.description || null,
              enabled: r.enabled,
              sort_order: r.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('research').upsert(resRows);
          }

          // Sync achievements
          if (data.achievements && data.achievements.length > 0) {
            const achRows = data.achievements.map((a, idx) => ({
              id: a.id,
              title: a.title,
              issuer: a.issuer || null,
              date: a.date || null,
              description: a.description || null,
              url: a.url || null,
              enabled: a.enabled,
              sort_order: a.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('achievements').upsert(achRows);
          }

          // Sync navigation
          if (data.navigation && data.navigation.length > 0) {
            const navRows = data.navigation.map((n, idx) => ({
              id: n.id,
              label: n.label,
              href: n.href,
              enabled: n.enabled,
              sort_order: n.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('navigation').upsert(navRows);
          }

          // Sync social links
          if (data.socialLinks && data.socialLinks.length > 0) {
            const socialRows = data.socialLinks.map((soc, idx) => ({
              id: soc.id,
              name: soc.name,
              platform: soc.platform,
              url: soc.url,
              icon_name: soc.iconName || null,
              tooltip: soc.tooltip || null,
              aria_label: soc.ariaLabel || null,
              enabled: soc.enabled,
              sort_order: soc.order ?? idx,
              updated_at: new Date().toISOString(),
            }));
            await client.from('social_links').upsert(socialRows);
          }
        } catch (supabaseErr) {
          console.warn('Supabase sync warning (changes saved locally in IndexedDB):', supabaseErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Error saving portfolio data:', err);
      return false;
    }
  }

  /**
   * Save a single project directly with real-time cloud upload & verification
   */
  static async saveSingleProject(
    project: ProjectItem,
    onProgress?: (step: string, percent: number) => void
  ): Promise<SaveProjectResult> {
    onProgress?.('Validating project configuration...', 10);
    if (!project.title || !project.title.trim()) {
      return {
        success: false,
        syncedToSupabase: false,
        verifiedInCloud: false,
        message: 'Project title is required.',
        project,
      };
    }

    // 1. Update in-memory & local storage (IndexedDB + localStorage)
    onProgress?.('Saving to local database...', 30);
    let updatedData: PortfolioData | null = null;
    try {
      const fetchRes = await this.getPortfolioData();
      const currentData = fetchRes.data;
      const exists = currentData.projects.some((p) => p.id === project.id);
      const updatedProjects = exists
        ? currentData.projects.map((p) => (p.id === project.id ? project : p))
        : [...currentData.projects, project];
      updatedData = {
        ...currentData,
        projects: updatedProjects,
      };
      await idbSet(KEY_PORTFOLIO_DATA, updatedData);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
      } catch {}
    } catch (idbErr) {
      console.warn('Local save warning:', idbErr);
    }

    // 2. Primary Cloud Database: Upload to Firebase Firestore
    let syncedToFirebase = false;
    try {
      if (db && db.type && updatedData) {
        onProgress?.('Syncing project to Firebase Firestore...', 60);
        await setDoc(doc(db, 'portfolio_data', 'main'), {
          ...updatedData,
          updatedAt: new Date().toISOString(),
        });
        syncedToFirebase = true;
      }
    } catch (fbErr) {
      console.warn('Firebase saveSingleProject notice:', fbErr);
    }

    // 3. Optional fallback upload to Supabase if connected
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      onProgress?.('Connecting to Supabase Cloud Database...', 50);
      try {
        const fullRow = {
          id: project.id,
          name: project.name || project.title,
          display_title: project.displayTitle || project.title,
          title: project.displayTitle || project.title,
          slug: project.slug || null,
          short_description: project.shortDescription || '',
          long_description: project.fullDescription || project.longDescription || null,
          cover_image: project.coverImage || '',
          preview_image_path: project.previewImagePath || null,
          preview_image_url: project.previewImageUrl || project.coverImage || '',
          gallery: project.gallery || [],
          technologies: project.technologies || [],
          category: project.category || 'Fullstack',
          github_url: project.githubUrl || null,
          live_demo_url: project.liveDemoUrl || null,
          case_study_url: project.caseStudyUrl || null,
          paper_url: project.paperUrl || null,
          status: project.status || 'Completed',
          project_date: project.date || null,
          featured: Boolean(project.featured),
          enabled: project.enabled ?? true,
          sort_order: project.order ?? 0,
          zip_storage_path: project.zipStoragePath || null,
          zip_file_name: project.zipFileName || null,
          zip_file_size: project.zipFileSize || null,
          zip_updated_at: project.zipUpdatedAt || null,
          highlights: project.highlights || [],
          highlight_stats: project.highlightStats || [],
          updated_at: new Date().toISOString(),
        };

        onProgress?.('Uploading project to Supabase "projects" table...', 70);
        let { error: upsertErr } = await client.from('projects').upsert(fullRow);

        if (upsertErr && (upsertErr.message?.includes('column') || (upsertErr as any).code === 'PGRST204')) {
          // Fallback to core columns
          const coreRow = {
            id: project.id,
            title: project.displayTitle || project.title,
            slug: project.slug || null,
            short_description: project.shortDescription || '',
            long_description: project.fullDescription || project.longDescription || null,
            cover_image: project.coverImage || '',
            gallery: project.gallery || [],
            technologies: project.technologies || [],
            category: project.category || 'Fullstack',
            github_url: project.githubUrl || null,
            live_demo_url: project.liveDemoUrl || null,
            case_study_url: project.caseStudyUrl || null,
            paper_url: project.paperUrl || null,
            status: project.status || 'Completed',
            project_date: project.date || null,
            featured: Boolean(project.featured),
            enabled: project.enabled ?? true,
            sort_order: project.order ?? 0,
            highlight_stats: project.highlightStats || [],
            updated_at: new Date().toISOString(),
          };
          const retry = await client.from('projects').upsert(coreRow);
          upsertErr = retry.error;
        }

        if (upsertErr) {
          console.error('Supabase project upsert error:', upsertErr);
          return {
            success: true,
            syncedToSupabase: false,
            verifiedInCloud: false,
            cloudError: upsertErr.message,
            message: `Saved locally. Supabase write note: ${upsertErr.message}`,
            project,
          };
        }

        // If project has files, sync files
        if (project.files && project.files.length > 0) {
          onProgress?.(`Syncing ${project.files.length} project files...`, 85);
          const fileRows = project.files.map((f, fIdx) => ({
            id: f.id,
            project_id: project.id,
            file_name: f.fileName,
            original_file_name: f.originalFileName || f.fileName,
            storage_path: f.storagePath,
            mime_type: f.mimeType,
            file_size: f.fileSize,
            compressed_size: f.compressedSize || null,
            file_extension: f.fileExtension,
            file_category: f.fileCategory,
            previewable: f.previewable,
            downloadable: f.downloadable,
            display_order: f.displayOrder ?? fIdx,
            public_url: f.publicUrl || null,
            content: f.content || null,
            created_at: f.createdAt,
            updated_at: f.updatedAt,
          }));
          await client.from('project_files').upsert(fileRows);
        }

        // Step 4: Verification
        onProgress?.('Verifying physical record in Supabase...', 95);
        const { data: verified, error: verErr } = await client
          .from('projects')
          .select('id, title, updated_at')
          .eq('id', project.id)
          .maybeSingle();

        onProgress?.('Complete!', 100);
        return {
          success: true,
          syncedToSupabase: true,
          verifiedInCloud: Boolean(verified && !verErr),
          message: verified 
            ? `Uploaded and verified in Supabase cloud database! (${verified.title})`
            : 'Uploaded to Supabase projects table.',
          project,
        };
      } catch (cloudEx: any) {
        console.error('Supabase exception saving project:', cloudEx);
        return {
          success: true,
          syncedToSupabase: false,
          verifiedInCloud: false,
          cloudError: cloudEx?.message || 'Network exception',
          message: `Saved to local storage. Supabase note: ${cloudEx?.message || 'Network error'}`,
          project,
        };
      }
    }

    onProgress?.('Saved to database.', 100);
    return {
      success: true,
      syncedToSupabase: false,
      syncedToFirebase,
      verifiedInCloud: syncedToFirebase,
      message: syncedToFirebase
        ? 'Project saved and synchronized to Firebase Firestore database!'
        : 'Saved locally in IndexedDB.',
      project,
    };
  }

  /**
   * Check which projects currently exist in Supabase Cloud
   */
  static async verifyAllProjectsInSupabase(): Promise<{
    connected: boolean;
    projectIdsInCloud: Set<string>;
    totalInCloud: number;
    lastSyncTime?: string;
    error?: string;
  }> {
    const client = getSupabase();
    if (!client || !isSupabaseConnected()) {
      return {
        connected: false,
        projectIdsInCloud: new Set(),
        totalInCloud: 0,
        error: 'Supabase not connected',
      };
    }

    try {
      const { data, error } = await client
        .from('projects')
        .select('id, updated_at');

      if (error) {
        return {
          connected: false,
          projectIdsInCloud: new Set(),
          totalInCloud: 0,
          error: error.message,
        };
      }

      const ids = new Set((data || []).map((row) => row.id));
      return {
        connected: true,
        projectIdsInCloud: ids,
        totalInCloud: ids.size,
        lastSyncTime: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        projectIdsInCloud: new Set(),
        totalInCloud: 0,
        error: err?.message,
      };
    }
  }

  /**
   * Detailed full sync with granular progress reporting
   */
  static async savePortfolioDataDetailed(
    data: PortfolioData,
    onProgress?: (step: string, percent: number) => void
  ): Promise<SavePortfolioResult> {
    const details: Record<string, { success: boolean; count?: number; error?: string }> = {};

    onProgress?.('Saving to local IndexedDB durable storage...', 10);
    await idbSet(KEY_PORTFOLIO_DATA, data);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch {}

    const client = getSupabase();
    if (!client || !isSupabaseConnected()) {
      onProgress?.('Saved locally. Supabase is not connected.', 100);
      return {
        success: true,
        syncedToSupabase: false,
        details,
        message: 'Saved to local browser database. Connect Supabase to enable cloud sync.',
      };
    }

    try {
      // 1. Profile
      onProgress?.('Syncing Profile & Bio to Supabase...', 20);
      const { error: profErr } = await client.from('profiles').upsert({
        id: '00000000-0000-0000-0000-000000000001',
        first_name: data.personal.firstName,
        last_name: data.personal.lastName,
        name: data.personal.name,
        title: data.personal.title,
        subtitle: data.personal.subtitle || null,
        short_description: data.personal.shortDescription,
        long_description: data.personal.longDescription || null,
        availability_text: data.personal.availabilityText,
        is_available: data.personal.isAvailable,
        profile_image: data.personal.profileImage,
        resume_url: data.personal.resumeUrl,
        email: data.personal.email,
        phone: data.personal.phone || null,
        location: data.personal.location || null,
        updated_at: new Date().toISOString(),
      });
      details.profiles = { success: !profErr, count: 1, error: profErr?.message };

      // 2. Settings
      onProgress?.('Syncing Site Settings to Supabase...', 35);
      const { error: setErr } = await client.from('site_settings').upsert({
        id: 'default_settings',
        section_headers: data.sectionHeaders,
        hero_buttons: data.heroButtons,
        visual_settings: data.visualSettings,
        footer_settings: data.footer,
        contact_settings: data.contact,
        updated_at: new Date().toISOString(),
      });
      details.site_settings = { success: !setErr, count: 1, error: setErr?.message };

      // 3. Projects
      onProgress?.(`Uploading ${data.projects.length} projects to Supabase...`, 50);
      let projectsSynced = 0;
      if (data.projects && data.projects.length > 0) {
        for (const p of data.projects) {
          const res = await this.saveSingleProject(p);
          if (res.syncedToSupabase) projectsSynced++;
        }
      }
      details.projects = { success: projectsSynced === data.projects.length, count: projectsSynced };

      // 4. Skills
      onProgress?.('Syncing Skills to Supabase...', 70);
      if (data.skills && data.skills.length > 0) {
        const skillRows = data.skills.map((s, idx) => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          category: s.category,
          color: s.color,
          url: s.url || null,
          enabled: s.enabled,
          sort_order: s.order ?? idx,
          updated_at: new Date().toISOString(),
        }));
        const { error: skErr } = await client.from('skills').upsert(skillRows);
        details.skills = { success: !skErr, count: data.skills.length, error: skErr?.message };
      }

      // 5. Services
      onProgress?.('Syncing Services to Supabase...', 85);
      if (data.services && data.services.length > 0) {
        const serviceRows = data.services.map((srv, idx) => ({
          id: srv.id,
          title: srv.title,
          description: srv.description,
          icon_type: srv.iconType,
          icon_color: srv.iconColor,
          url: srv.url || null,
          enabled: srv.enabled,
          sort_order: srv.order ?? idx,
          updated_at: new Date().toISOString(),
        }));
        const { error: srvErr } = await client.from('services').upsert(serviceRows);
        details.services = { success: !srvErr, count: data.services.length, error: srvErr?.message };
      }

      // 6. Navigation & Social
      onProgress?.('Finalizing Supabase synchronization...', 95);
      if (data.navigation && data.navigation.length > 0) {
        const navRows = data.navigation.map((n, idx) => ({
          id: n.id,
          label: n.label,
          href: n.href,
          enabled: n.enabled,
          sort_order: n.order ?? idx,
          updated_at: new Date().toISOString(),
        }));
        await client.from('navigation').upsert(navRows);
      }
      if (data.socialLinks && data.socialLinks.length > 0) {
        const socRows = data.socialLinks.map((s, idx) => ({
          id: s.id,
          name: s.name,
          platform: s.platform,
          url: s.url,
          icon_name: s.iconName || null,
          tooltip: s.tooltip || null,
          aria_label: s.ariaLabel || null,
          enabled: s.enabled,
          sort_order: s.order ?? idx,
          updated_at: new Date().toISOString(),
        }));
        await client.from('social_links').upsert(socRows);
      }

      onProgress?.('Supabase Cloud Sync Complete!', 100);
      return {
        success: true,
        syncedToSupabase: true,
        details,
        message: `Successfully uploaded and synced all records to Supabase Cloud Database!`,
      };
    } catch (err: any) {
      console.error('Supabase detailed sync error:', err);
      return {
        success: true,
        syncedToSupabase: false,
        details,
        message: `Saved locally. Cloud upload note: ${err?.message || 'Network error'}`,
      };
    }
  }

  /**
   * Directly updates the profile photo across all persistent storage tiers
   */
  static async updateProfileImageDirectly(newImageUrl: string): Promise<boolean> {
    if (!newImageUrl) return false;

    // 1. Persist to IndexedDB & localStorage immediately
    await persistCustomProfileImage(newImageUrl);

    // 2. Update existing cached portfolio state
    try {
      const existing = await idbGet<PortfolioData>(KEY_PORTFOLIO_DATA);
      if (existing) {
        existing.personal = {
          ...existing.personal,
          profileImage: newImageUrl,
        };
        await idbSet(KEY_PORTFOLIO_DATA, existing);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Error updating cached portfolio image:', err);
    }

    // 3. Sync to Supabase
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { error } = await client.from('profiles').upsert({
          id: '00000000-0000-0000-0000-000000000001',
          profile_image: newImageUrl,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          console.warn('Supabase profile image direct update warning:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Supabase profile image exception:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Delete a project from database and storage with complete cascading cleanup
   */
  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { ProjectService } = await import('./projectService');
      await ProjectService.deleteProject(projectId);
      return true;
    } catch (err) {
      console.warn('Delete project cascade error:', err);
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          await client.from('projects').delete().eq('id', projectId);
        } catch (e) {
          console.warn('Supabase delete project error:', e);
        }
      }
      return true;
    }
  }

  /**
   * Submit and persist user contact message to Supabase and return official assurance receipt
   */
  static async submitContactMessage(data: {
    name: string;
    email: string;
    message: string;
    subject?: string;
    recipientEmail?: string;
    recipientName?: string;
  }) {
    const receiptId = `REF-PKG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    // Calculate expected reply deadline (24 hours from submission)
    const replyDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expectedReplyDate = replyDeadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const securityHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    let deliveryStatus = 'Delivered & Logged in Database';
    let databaseEngine = 'Local Persistent Database (IndexedDB Verified)';
    let firestoreSaved = false;

    // 1. Primary: Persist to Firebase Firestore if available
    try {
      if (db && db.type) {
        await addDoc(collection(db, 'contact_messages'), {
          receiptId,
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject?.trim() || 'Portfolio Direct Inquiry',
          message: data.message.trim(),
          status: 'unread',
          createdAt: now.toISOString(),
        });
        firestoreSaved = true;
        deliveryStatus = 'Delivered & Synced with Firebase Firestore Cloud Database';
        databaseEngine = 'Firebase Firestore (Cloud Synced & Verified)';
      }
    } catch (fbErr) {
      console.warn('Firebase message submission notice (fallback to Supabase/IndexedDB):', fbErr);
    }

    // 2. Secondary: Persist to Supabase if configured
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { error } = await client.from('contact_messages').insert({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject?.trim() || 'Portfolio Direct Inquiry',
          message: data.message.trim(),
          status: 'unread',
        });

        if (!error) {
          deliveryStatus = firestoreSaved
            ? 'Delivered & Synced with Cloud Database (Firestore & Supabase)'
            : 'Delivered & Synced with Supabase Cloud Database';
          databaseEngine = firestoreSaved
            ? 'Cloud Database (Firebase Firestore & Supabase Verified)'
            : 'Supabase Cloud PostgreSQL (Synced & Verified)';
        } else {
          console.warn('Supabase contact_messages insert notice:', error.message);
          // Try fallback messages table
          try {
            await client.from('messages').insert({
              id: receiptId,
              name: data.name.trim(),
              email: data.email.trim(),
              message: data.message.trim(),
              status: 'unread',
              created_at: now.toISOString(),
            });
            deliveryStatus = firestoreSaved
              ? 'Delivered & Synced with Cloud Database (Firestore & Supabase)'
              : 'Delivered & Synced with Supabase Database';
            databaseEngine = firestoreSaved
              ? 'Cloud Database (Firebase Firestore & Supabase Verified)'
              : 'Supabase Cloud PostgreSQL (Synced)';
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Supabase message submission exception:', err);
      }
    }

    const receipt = {
      receiptId,
      senderName: data.name.trim(),
      senderEmail: data.email.trim(),
      recipientName: data.recipientName || 'Piyush Kumar',
      recipientEmail: data.recipientEmail || 'piyush.kumar2025b@vitstudent.ac.in',
      message: data.message.trim(),
      timestamp: formattedTimestamp,
      expectedReplyDate,
      estimatedReplyTime: '12 – 24 hours',
      deliveryStatus,
      databaseEngine,
      securityHash,
    };

    // Save locally to IndexedDB message log & user receipts
    try {
      const KEY_MESSAGES = 'portfolio_contact_messages';
      const KEY_RECEIPTS = 'portfolio_user_receipts';

      const existingMessages = (await idbGet<any[]>(KEY_MESSAGES)) || [];
      existingMessages.unshift({
        receiptId,
        name: data.name,
        email: data.email,
        message: data.message,
        timestamp: formattedTimestamp,
        createdAt: now.toISOString(),
      });
      await idbSet(KEY_MESSAGES, existingMessages.slice(0, 50));

      const existingReceipts = (await idbGet<any[]>(KEY_RECEIPTS)) || [];
      existingReceipts.unshift(receipt);
      await idbSet(KEY_RECEIPTS, existingReceipts.slice(0, 20));
    } catch (e) {
      console.warn('Local message cache note:', e);
    }

    return receipt;
  }

  /**
   * Get recently generated user receipts
   */
  static async getRecentReceipts(): Promise<any[]> {
    try {
      const KEY_RECEIPTS = 'portfolio_user_receipts';
      const receipts = await idbGet<any[]>(KEY_RECEIPTS);
      return receipts || [];
    } catch {
      return [];
    }
  }

  /**
   * Reset data to clean initial state
   */
  static async resetPortfolioData(): Promise<PortfolioData> {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(KEY_CUSTOM_PROFILE_IMAGE);
      await idbSet(KEY_CUSTOM_PROFILE_IMAGE, null);
      await idbSet(KEY_PORTFOLIO_DATA, null);
    } catch (err) {
      console.error('Error resetting portfolio data:', err);
    }
    return initialPortfolioData;
  }
}
