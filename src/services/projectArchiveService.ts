import JSZip from 'jszip';
import { ProjectItem, ProjectFile } from '../types/portfolio';
import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { formatFileSize } from '../utils/fileUtils';

const STORAGE_BUCKET = 'portfolio-assets';

export interface ZipGenerationResult {
  success: boolean;
  zipBlob?: Blob;
  zipFileName?: string;
  zipFileSize?: number;
  zipStoragePath?: string;
  publicUrl?: string;
  fileCount?: number;
  error?: string;
}

export class ProjectArchiveService {
  /**
   * Generates a real, compressed project archive (.zip) containing all project files.
   * Uploads the archive to Supabase Storage and updates project database metadata.
   */
  static async generateProjectZip(
    project: ProjectItem,
    files: ProjectFile[],
    onProgress?: (percent: number, status: string) => void
  ): Promise<ZipGenerationResult> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'Cannot generate archive: This project has no uploaded files.',
        };
      }

      onProgress?.(5, 'Initializing project ZIP archive...');
      const zip = new JSZip();

      // Create a clean root directory inside the zip
      const safeSlug = (project.slug || project.title || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const rootFolder = zip.folder(safeSlug) || zip;

      // 1. Generate an informative README.md inside the archive
      const readmeContent = `# ${project.displayTitle || project.name || project.title}

${project.shortDescription}

${project.fullDescription || project.longDescription || ''}

## Technologies & Stack
${(project.technologies || []).map((t) => `- ${t}`).join('\n')}

${project.liveDemoUrl ? `## Live Demo\n${project.liveDemoUrl}\n` : ''}
${project.githubUrl ? `## GitHub Repository\n${project.githubUrl}\n` : ''}

## File Manifest (${files.length} files)
${files.map((f) => `- ${f.fileName} (${formatFileSize(f.fileSize)}, ${f.fileCategory})`).join('\n')}

---
Generated from Portfolio Repository System on ${new Date().toUTCString()}
`;
      rootFolder.file('README.md', readmeContent, {
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // 2. Add each real file with content-aware optimization
      const totalFiles = files.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const progressPct = Math.round(10 + ((i + 1) / totalFiles) * 60);
        onProgress?.(progressPct, `Packaging ${file.fileName} (${i + 1}/${totalFiles})...`);

        try {
          // If file has direct text/code content
          if (file.content !== undefined && file.content !== null) {
            rootFolder.file(file.fileName, file.content, {
              compression: 'DEFLATE',
              compressionOptions: { level: 6 },
            });
            continue;
          }

          // If file has a public or data URL, fetch its binary
          if (file.publicUrl) {
            const isAlreadyCompressed = [
              'image',
              'video',
              'audio',
              'archive',
              'pdf',
            ].includes(file.fileCategory);

            try {
              const res = await fetch(file.publicUrl);
              if (res.ok) {
                const blob = await res.blob();
                rootFolder.file(file.fileName, blob, {
                  compression: isAlreadyCompressed ? 'STORE' : 'DEFLATE',
                  compressionOptions: isAlreadyCompressed ? undefined : { level: 6 },
                });
                continue;
              }
            } catch (fetchErr) {
              console.warn(`Could not fetch file binary for ${file.fileName}:`, fetchErr);
            }
          }

          // Fallback: If no binary accessible, write a placeholder descriptor
          rootFolder.file(
            file.fileName + '.info.txt',
            `File: ${file.originalFileName}\nSize: ${file.fileSize} bytes\nCategory: ${file.fileCategory}\nStorage Path: ${file.storagePath}`
          );
        } catch (fileErr) {
          console.warn(`Error processing file ${file.fileName}:`, fileErr);
        }
      }

      onProgress?.(75, 'Compressing archive stream...');

      // 3. Generate final ZIP Blob
      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          mimeType: 'application/zip',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          const zipPct = Math.round(75 + (metadata.percent / 100) * 15);
          onProgress?.(zipPct, `Finalizing compression (${Math.round(metadata.percent)}%)...`);
        }
      );

      const zipFileName = `${safeSlug}-v${new Date().toISOString().slice(0, 10)}.zip`;
      const zipFileSize = zipBlob.size;
      let zipStoragePath = `project-files/${project.id}/archives/${zipFileName}`;
      let publicUrl = '';

      onProgress?.(90, 'Uploading ZIP to storage repository...');

      // 4. Upload ZIP to Supabase Storage
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(zipStoragePath, zipBlob, {
              contentType: 'application/zip',
              cacheControl: '3600',
              upsert: true,
            });

          if (!uploadError && uploadData?.path) {
            zipStoragePath = uploadData.path;
            const { data: urlData } = client.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(uploadData.path);
            publicUrl = urlData?.publicUrl || '';
          }

          // Update Project record in database
          await client
            .from('projects')
            .update({
              zip_storage_path: zipStoragePath,
              zip_file_name: zipFileName,
              zip_file_size: zipFileSize,
              zip_updated_at: new Date().toISOString(),
            })
            .eq('id', project.id);
        } catch (storageErr) {
          console.warn('Supabase archive storage exception:', storageErr);
        }
      }

      // If no public URL was generated by Supabase, create local Object URL
      if (!publicUrl) {
        publicUrl = URL.createObjectURL(zipBlob);
      }

      onProgress?.(100, `ZIP Archive ready (${formatFileSize(zipFileSize)})`);

      return {
        success: true,
        zipBlob,
        zipFileName,
        zipFileSize,
        zipStoragePath,
        publicUrl,
        fileCount: files.length,
      };
    } catch (err: any) {
      console.error('ProjectArchiveService.generateProjectZip error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to generate project ZIP archive',
      };
    }
  }

  /**
   * Initiates browser download of the generated project ZIP file
   */
  static downloadZipFile(blobOrUrl: Blob | string, fileName: string): void {
    const link = document.createElement('a');
    let objectUrl = '';

    if (blobOrUrl instanceof Blob) {
      objectUrl = URL.createObjectURL(blobOrUrl);
      link.href = objectUrl;
    } else {
      link.href = blobOrUrl;
    }

    link.download = fileName || 'project-source.zip';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (objectUrl) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
  }
}
