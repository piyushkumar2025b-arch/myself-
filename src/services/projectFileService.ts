import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { ProjectFile, FileCategory } from '../types/portfolio';
import { detectFileCategory, getFileExtension, sanitizeFileName, isDangerousFileExtension } from '../utils/fileUtils';
import { StorageService } from './storageService';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per file

export class ProjectFileService {
  /**
   * Upload and register a real project file
   */
  static async uploadProjectFile(
    projectId: string,
    file: File,
    onProgress?: (percent: number, status: string) => void
  ): Promise<{ success: boolean; projectFile?: ProjectFile; error?: string }> {
    try {
      if (!projectId) {
        return { success: false, error: 'Project ID is required' };
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { 
          success: false, 
          error: `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` 
        };
      }

      if (isDangerousFileExtension(file.name)) {
        return {
          success: false,
          error: 'Security Error: Executable and dangerous script files are prohibited from upload.',
        };
      }

      onProgress?.(15, 'Validating and reading file...');
      const cleanName = sanitizeFileName(file.name);
      const ext = getFileExtension(cleanName);
      const category: FileCategory = detectFileCategory(cleanName, file.type);
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Read text content for code/text/data files for instant preview
      let inlineContent: string | undefined = undefined;
      if (['code', 'text', 'data'].includes(category) && file.size < 2 * 1024 * 1024) {
        try {
          inlineContent = await file.text();
        } catch (e) {
          console.warn('Could not read text content:', e);
        }
      }

      onProgress?.(40, 'Uploading to storage...');
      let storagePath = `project-files/${projectId}/${Date.now()}_${cleanName}`;
      let publicUrl = '';

      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          const bucketName = await StorageService.getTargetBucket(client);
          const { data: uploadData, error: uploadError } = await client.storage
            .from(bucketName)
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            console.warn(`Supabase storage upload note (${bucketName}):`, uploadError.message);
          } else if (uploadData?.path) {
            storagePath = uploadData.path;
            const { data: urlData } = client.storage
              .from(bucketName)
              .getPublicUrl(uploadData.path);
            publicUrl = urlData?.publicUrl || '';
          }
        } catch (storageErr: any) {
          console.warn('Supabase file storage exception:', storageErr);
        }
      }

      // If text/data or client URL not generated, generate blob URL or fallback
      if (!publicUrl) {
        if (inlineContent && ['code', 'text', 'data'].includes(category)) {
          publicUrl = `data:${file.type || 'text/plain'};charset=utf-8,${encodeURIComponent(inlineContent)}`;
        } else if (category === 'image' || category === 'pdf' || category === 'video' || category === 'audio') {
          // Read as data URL for offline fallback
          try {
            publicUrl = await this.readFileAsDataUrl(file);
          } catch {
            publicUrl = URL.createObjectURL(file);
          }
        }
      }

      onProgress?.(80, 'Saving file metadata to database...');

      const newFile: ProjectFile = {
        id: fileId,
        projectId,
        fileName: cleanName,
        originalFileName: file.name,
        storagePath,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileExtension: ext,
        fileCategory: category,
        previewable: category !== 'archive' && category !== 'other',
        downloadable: true,
        displayOrder: Date.now(),
        publicUrl,
        content: inlineContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // If Supabase is connected, record in project_files table
      if (client && isSupabaseConnected()) {
        try {
          const { error: dbError } = await client.from('project_files').insert({
            id: newFile.id,
            project_id: newFile.projectId,
            file_name: newFile.fileName,
            original_file_name: newFile.originalFileName,
            storage_path: newFile.storagePath,
            mime_type: newFile.mimeType,
            file_size: newFile.fileSize,
            file_extension: newFile.fileExtension,
            file_category: newFile.fileCategory,
            previewable: newFile.previewable,
            downloadable: newFile.downloadable,
            display_order: newFile.displayOrder,
            public_url: newFile.publicUrl,
            content: newFile.content || null,
            created_at: newFile.createdAt,
            updated_at: newFile.updatedAt,
          });

          if (dbError) {
            console.warn('Supabase project_files insert note:', dbError.message);
          }
        } catch (dbErr) {
          console.warn('Supabase DB project_files exception:', dbErr);
        }
      }

      onProgress?.(100, 'Upload complete!');
      return { success: true, projectFile: newFile };
    } catch (err: any) {
      console.error('ProjectFileService.uploadProjectFile error:', err);
      return { success: false, error: err?.message || 'File upload failed' };
    }
  }

  /**
   * Delete a project file from storage and database
   */
  static async deleteProjectFile(file: ProjectFile): Promise<boolean> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        // Delete from database
        await client.from('project_files').delete().eq('id', file.id);
        
        // Delete from storage if real storage path
        if (file.storagePath && !file.storagePath.startsWith('inline/') && !file.storagePath.startsWith('data:')) {
          const bucketName = await StorageService.getTargetBucket(client);
          await client.storage.from(bucketName).remove([file.storagePath]);
        }
        return true;
      } catch (err) {
        console.warn('Error deleting project file from Supabase:', err);
      }
    }
    return true;
  }

  /**
   * Fetch files for a specific project
   */
  static async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('project_files')
          .select('*')
          .eq('project_id', projectId)
          .order('display_order', { ascending: true });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            projectId: row.project_id,
            fileName: row.file_name,
            originalFileName: row.original_file_name || row.file_name,
            storagePath: row.storage_path,
            mimeType: row.mime_type,
            fileSize: Number(row.file_size || 0),
            compressedSize: row.compressed_size ? Number(row.compressed_size) : undefined,
            fileExtension: row.file_extension || getFileExtension(row.file_name),
            fileCategory: row.file_category || detectFileCategory(row.file_name, row.mime_type),
            previewable: row.previewable ?? true,
            downloadable: row.downloadable ?? true,
            displayOrder: row.display_order ?? 0,
            publicUrl: row.public_url || '',
            content: row.content || undefined,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Error fetching project files from Supabase:', err);
      }
    }
    return [];
  }

  /**
   * Helper: Read file as Data URL
   */
  private static readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as data URL'));
      reader.readAsDataURL(file);
    });
  }
}
