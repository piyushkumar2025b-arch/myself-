-- ==============================================================================
-- PIYUSH KUMAR PORTFOLIO — COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- RUN THIS SCRIPT ONCE IN YOUR SUPABASE PROJECT SQL EDITOR
-- Sets up all 15 relational tables, storage buckets, and access policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STORAGE BUCKET FOR UPLOADS & ATTACHMENTS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public Storage Access Policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public View Portfolio Assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload Portfolio Assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update Portfolio Assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete Portfolio Assets" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Public View Portfolio Assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'portfolio-assets');

CREATE POLICY "Public Upload Portfolio Assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'portfolio-assets');

CREATE POLICY "Public Update Portfolio Assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'portfolio-assets');

CREATE POLICY "Public Delete Portfolio Assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'portfolio-assets');


-- 3. PROFILES TABLE (Bio, Availability, Contact)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL DEFAULT 'Piyush',
  last_name TEXT NOT NULL DEFAULT 'Kumar.',
  name TEXT NOT NULL DEFAULT 'Piyush Kumar',
  title TEXT NOT NULL DEFAULT 'Software Engineer & AI Developer',
  subtitle TEXT DEFAULT NULL,
  short_description TEXT NOT NULL DEFAULT 'I build intelligent systems and digital experiences that solve real-world problems using modern technologies.',
  long_description TEXT DEFAULT NULL,
  availability_text TEXT NOT NULL DEFAULT 'Available for new projects',
  is_available BOOLEAN NOT NULL DEFAULT true,
  profile_image TEXT DEFAULT '',
  resume_url TEXT DEFAULT '',
  email TEXT NOT NULL DEFAULT 'dani009567@gmail.com',
  phone TEXT DEFAULT NULL,
  location TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial profile row if empty
INSERT INTO public.profiles (id, first_name, last_name, name, title, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Piyush', 'Kumar.', 'Piyush Kumar', 'Software Engineer & AI Developer', 'dani009567@gmail.com')
ON CONFLICT (id) DO NOTHING;


-- 4. NAVIGATION TABLE
CREATE TABLE IF NOT EXISTS public.navigation (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. SOCIAL LINKS TABLE
CREATE TABLE IF NOT EXISTS public.social_links (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT DEFAULT NULL,
  tooltip TEXT DEFAULT NULL,
  aria_label TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT NULL,
  category TEXT NOT NULL DEFAULT 'frontend',
  color TEXT DEFAULT '#38bdf8',
  url TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 7. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_type TEXT NOT NULL DEFAULT 'code',
  icon_color TEXT DEFAULT '#38bdf8',
  url TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 8. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT DEFAULT NULL,
  display_title TEXT DEFAULT NULL,
  slug TEXT DEFAULT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  long_description TEXT DEFAULT NULL,
  cover_image TEXT NOT NULL DEFAULT '',
  preview_image_path TEXT DEFAULT NULL,
  preview_image_url TEXT DEFAULT NULL,
  gallery JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'Fullstack',
  github_url TEXT DEFAULT NULL,
  live_demo_url TEXT DEFAULT NULL,
  case_study_url TEXT DEFAULT NULL,
  paper_url TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  project_date TEXT DEFAULT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  zip_storage_path TEXT DEFAULT NULL,
  zip_file_name TEXT DEFAULT NULL,
  zip_file_size BIGINT DEFAULT NULL,
  zip_updated_at TIMESTAMPTZ DEFAULT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  highlight_stats JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all project columns exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS display_title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS preview_image_path TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_storage_path TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_file_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_file_size BIGINT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_updated_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS highlight_stats JSONB DEFAULT '[]'::jsonb;


-- 9. PROJECT FILES TABLE (Source code, documents, models, datasets)
CREATE TABLE IF NOT EXISTS public.project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size BIGINT NOT NULL DEFAULT 0,
  compressed_size BIGINT DEFAULT NULL,
  file_extension TEXT DEFAULT NULL,
  file_category TEXT NOT NULL DEFAULT 'other',
  previewable BOOLEAN NOT NULL DEFAULT true,
  downloadable BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  public_url TEXT DEFAULT NULL,
  content TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 10. PROJECT COMMENTS TABLE (Public Reviews & Moderation)
CREATE TABLE IF NOT EXISTS public.project_comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT DEFAULT '',
  comment TEXT NOT NULL,
  content TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 11. WORK EXPERIENCES TABLE
CREATE TABLE IF NOT EXISTS public.experiences (
  id TEXT PRIMARY KEY,
  organization TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT DEFAULT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  company_url TEXT DEFAULT NULL,
  logo TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 12. EDUCATION TABLE
CREATE TABLE IF NOT EXISTS public.education (
  id TEXT PRIMARY KEY,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  grade TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  logo TEXT DEFAULT NULL,
  url TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 13. RESEARCH & PUBLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.research (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors JSONB DEFAULT '[]'::jsonb,
  venue TEXT DEFAULT NULL,
  publication_date TEXT DEFAULT NULL,
  url TEXT DEFAULT NULL,
  pdf_url TEXT DEFAULT NULL,
  doi TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 14. ACHIEVEMENTS & AWARDS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  achievement_date TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  url TEXT DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 15. PUBLIC DOCUMENTS / VAULT TABLE
CREATE TABLE IF NOT EXISTS public.public_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_extension TEXT DEFAULT NULL,
  mime_type TEXT DEFAULT 'application/octet-stream',
  category TEXT NOT NULL DEFAULT 'Guides & Notes',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  uploaded_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 16. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_settings',
  section_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  hero_buttons JSONB NOT NULL DEFAULT '{}'::jsonb,
  visual_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings row if empty
INSERT INTO public.site_settings (id, section_headers, hero_buttons, visual_settings, footer_settings, contact_settings)
VALUES ('default_settings', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- 17. CONTACT MESSAGES TABLE (Incoming form submissions)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT 'Portfolio Inquiry',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 18. PERMISSIVE ACCESS & SECURITY POLICIES
-- Disable RLS or set open policies to permit both public readers and admin edits seamlessly
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.navigation DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.research DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.public_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Confirmation output
SELECT 'Piyush Kumar Portfolio Supabase Database Setup Complete! 15 Tables & Storage Bucket Ready.' AS result;
