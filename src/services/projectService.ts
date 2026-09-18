import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { ProjectItem } from '../types/portfolio';
import { compressImageFile } from './storageService';
import { ProjectFileService } from './projectFileService';
import { ProjectCommentService } from './projectCommentService';

const STORAGE_BUCKET = 'portfolio-assets';

export class ProjectService {
  /**
   * Optimize and upload a project preview/header image
   */
  static async uploadPreviewImage(
    projectId: string,
    file: File
  ): Promise<{ success: boolean; url?: string; storagePath?: string; error?: string }> {
    try {
      if (!file) return { success: false, error: 'No file provided' };

      // 1. Validate MIME type
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Uploaded file must be a valid image format (PNG, JPG, WebP, SVG).' };
      }

      // 2. Optimize image: max dimension 1600px, quality 0.90, preserve aspect ratio
      let processedFile = file;
      let dataUrl = '';
      try {
        const compressed = await compressImageFile(file, 1600, 0.90);
        processedFile = compressed.file;
        dataUrl = compressed.dataUrl;
      } catch (e) {
        console.warn('Image optimization fallback:', e);
      }

      const client = getSupabase();
      const ext = file.name.split('.').pop() || 'webp';
      const cleanPath = `project-assets/${projectId}/preview/header_${Date.now()}.${ext}`;

      // 3. Upload to Supabase Storage if connected
      if (client && isSupabaseConnected()) {
        try {
          const { data, error } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(cleanPath, processedFile, {
              cacheControl: '3600',
              upsert: true,
            });

          if (!error && data?.path) {
            const { data: urlData } = client.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(data.path);

            if (urlData?.publicUrl) {
              return {
                success: true,
                url: urlData.publicUrl,
                storagePath: data.path,
              };
            }
          } else if (error) {
            console.warn('Supabase storage upload error:', error.message);
          }
        } catch (storageErr) {
          console.warn('Supabase image upload exception:', storageErr);
        }
      }

      // 4. Resilient local fallback
      return {
        success: true,
        url: dataUrl || URL.createObjectURL(processedFile),
        storagePath: cleanPath,
      };
    } catch (err: any) {
      console.error('ProjectService.uploadPreviewImage error:', err);
      return { success: false, error: err?.message || 'Failed to upload preview image' };
    }
  }

  /**
   * Delete a project and its assets from Supabase
   */
  static async deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        // Delete from project_files first
        await client.from('project_files').delete().eq('project_id', projectId);
        // Delete from project_comments
        await client.from('project_comments').delete().eq('project_id', projectId);
        // Delete from projects table
        const { error } = await client.from('projects').delete().eq('id', projectId);
        if (error) {
          console.warn('Supabase project delete error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase delete exception:', err);
        return { success: false, error: err?.message };
      }
    }
    return { success: true };
  }

  /**
   * Fetch complete project by ID with relational files and comments
   */
  static async getProjectDetails(projectId: string): Promise<ProjectItem | null> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { data: projectRow, error } = await client
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (!error && projectRow) {
          const [files, comments] = await Promise.all([
            ProjectFileService.getProjectFiles(projectId),
            ProjectCommentService.getApprovedComments(projectId),
          ]);

          return {
            id: projectRow.id,
            name: projectRow.name || projectRow.title,
            displayTitle: projectRow.display_title || projectRow.title,
            title: projectRow.display_title || projectRow.title,
            slug: projectRow.slug,
            shortDescription: projectRow.short_description,
            longDescription: projectRow.long_description,
            fullDescription: projectRow.long_description,
            coverImage: projectRow.cover_image,
            previewImagePath: projectRow.preview_image_path,
            previewImageUrl: projectRow.preview_image_url || projectRow.cover_image,
            technologies: Array.isArray(projectRow.technologies) ? projectRow.technologies : [],
            category: projectRow.category,
            githubUrl: projectRow.github_url,
            liveDemoUrl: projectRow.live_demo_url,
            caseStudyUrl: projectRow.case_study_url,
            paperUrl: projectRow.paper_url,
            status: projectRow.status,
            date: projectRow.project_date,
            featured: projectRow.featured ?? false,
            enabled: projectRow.enabled ?? true,
            order: projectRow.sort_order ?? 0,
            zipStoragePath: projectRow.zip_storage_path,
            zipFileName: projectRow.zip_file_name,
            zipFileSize: projectRow.zip_file_size ? Number(projectRow.zip_file_size) : undefined,
            zipUpdatedAt: projectRow.zip_updated_at,
            files,
            comments,
            highlights: Array.isArray(projectRow.highlights) ? projectRow.highlights : [],
            createdAt: projectRow.created_at,
            updatedAt: projectRow.updated_at,
          };
        }
      } catch (err) {
        console.warn('Error fetching project details from Supabase:', err);
      }
    }
    return null;
  }
}
