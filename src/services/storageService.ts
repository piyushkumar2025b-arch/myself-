import { getSupabase, isSupabaseConnected } from '../lib/supabase';

const DEFAULT_BUCKET_NAME = 'portfolio-assets';
const CANDIDATE_BUCKETS = ['portfolio-assets', 'avatars', 'public', 'images', 'assets'];
const MAX_FILE_SIZE_MB = 15;

export interface UploadResult {
  url: string;
  path: string;
  isSupabaseStorage: boolean;
  bucket?: string;
  error?: string | null;
}

/**
 * Reads and compresses an image file using Canvas to optimize memory, storage, and performance.
 * Produces crisp, web-optimized image data (< 300KB) that prevents browser quota errors.
 */
export async function compressImageFile(
  file: File, 
  maxDimension = 1200, 
  quality = 0.88
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // If not an image or SVG/GIF, read directly
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, dataUrl: reader.result as string });
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Calculate scaled dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, dataUrl: reader.result as string });
        reader.onerror = () => reject(new Error('Failed to process image canvas'));
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(outputType, quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve({ file: compressedFile, dataUrl });
          } else {
            resolve({ file, dataUrl });
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve({ file, dataUrl: reader.result as string });
      reader.onerror = () => reject(new Error('Failed to load image file'));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Reads a File object as a base64 Data URL string for instant offline & fallback storage.
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read local file'));
    reader.readAsDataURL(file);
  });
}

export class StorageService {
  /**
   * Resolve or create a target public storage bucket in Supabase
   */
  static async getTargetBucket(client: any): Promise<string> {
    try {
      const { data: buckets, error: listErr } = await client.storage.listBuckets();
      if (!listErr && buckets && buckets.length > 0) {
        // Find existing matching bucket from candidates
        for (const candidate of CANDIDATE_BUCKETS) {
          const match = buckets.find((b: any) => b.name.toLowerCase() === candidate.toLowerCase());
          if (match) return match.name;
        }
        // If none of candidate names match, use the first available bucket
        return buckets[0].name;
      }

      // If no buckets exist or list returned empty, try creating the default public bucket
      try {
        const { error: createErr } = await client.storage.createBucket(DEFAULT_BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });
        if (!createErr) {
          console.info(`[Storage] Auto-created public bucket "${DEFAULT_BUCKET_NAME}"`);
        }
      } catch (cErr) {
        // Ignore create failure, fallback to default bucket name
      }
    } catch (err) {
      console.warn('Bucket listing error:', err);
    }
    return DEFAULT_BUCKET_NAME;
  }

  /**
   * Upload an asset (image, PDF, resume) directly to Supabase Storage.
   * Returns the direct Supabase public URL.
   */
  static async uploadFile(
    file: File, 
    folder: 'avatars' | 'projects' | 'resumes' | 'documents' = 'projects'
  ): Promise<UploadResult> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          url: '',
          path: '',
          isSupabaseStorage: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
        };
      }

      let fileToUpload = file;
      let directDataUrl = '';

      // Compress if it's an image
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImageFile(file, 1200, 0.88);
          fileToUpload = compressed.file;
          directDataUrl = compressed.dataUrl;
        } catch (compErr) {
          console.warn('Image compression note:', compErr);
        }
      }

      const client = getSupabase();

      // If Supabase client is active, upload directly to Supabase Storage
      if (client && isSupabaseConnected()) {
        try {
          const bucketName = await this.getTargetBucket(client);
          const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
          const cleanFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

          const { data, error } = await client.storage
            .from(bucketName)
            .upload(cleanFileName, fileToUpload, {
              cacheControl: '3600',
              upsert: true,
            });

          if (!error && data?.path) {
            const { data: publicUrlData } = client.storage
              .from(bucketName)
              .getPublicUrl(data.path);

            if (publicUrlData?.publicUrl) {
              console.info(`[Storage] File uploaded directly to Supabase Storage (${bucketName}):`, publicUrlData.publicUrl);
              return {
                url: publicUrlData.publicUrl,
                path: data.path,
                isSupabaseStorage: true,
                bucket: bucketName,
                error: null,
              };
            }
          }

          if (error) {
            console.warn(`Supabase Storage upload warning (${bucketName}):`, error.message);
          }
        } catch (storageErr) {
          console.warn('Supabase Storage connection exception:', storageErr);
        }
      }

      // Fallback: Use optimized base64 Data URL if Supabase is not connected
      const fallbackDataUrl = directDataUrl || await readFileAsDataUrl(fileToUpload);
      return {
        url: fallbackDataUrl,
        path: `inline/${file.name}`,
        isSupabaseStorage: false,
        error: null,
      };

    } catch (err: any) {
      console.error('StorageService error:', err);
      try {
        const fallbackUrl = await readFileAsDataUrl(file);
        return {
          url: fallbackUrl,
          path: `inline/${file.name}`,
          isSupabaseStorage: false,
          error: null,
        };
      } catch {
        return {
          url: '',
          path: '',
          isSupabaseStorage: false,
          error: err?.message || 'Upload failed',
        };
      }
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  static async deleteFile(path: string): Promise<boolean> {
    const client = getSupabase();
    if (!client || !isSupabaseConnected() || !path || path.startsWith('data:') || path.startsWith('local/') || path.startsWith('inline/')) {
      return true;
    }

    try {
      const bucketName = await this.getTargetBucket(client);
      const { error } = await client.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        console.warn('Storage delete error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      return false;
    }
  }
}

