import { FileCategory } from '../types/portfolio';

/**
 * Format raw bytes into human readable string (e.g. "1.4 MB", "42 KB", "850 B")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);

  if (i === 0) return `${bytes} B`;
  const formatted = (bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0).replace(/\.0$/, '');
  return `${formatted} ${sizes[i]}`;
}

/**
 * Extract clean lowercase file extension
 */
export function getFileExtension(fileName: string): string {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase().trim();
}

/**
 * Content-aware Category Detection based on filename extension and MIME type
 */
export function detectFileCategory(fileName: string, mimeType?: string): FileCategory {
  const ext = getFileExtension(fileName);
  const mime = (mimeType || '').toLowerCase();

  // Images
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return 'image';
  }

  // Videos
  if (
    ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext) ||
    mime.startsWith('video/')
  ) {
    return 'video';
  }

  // Audio
  if (
    ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext) ||
    mime.startsWith('audio/')
  ) {
    return 'audio';
  }

  // PDF
  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }

  // Archives
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext) ||
    ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip'].includes(mime)
  ) {
    return 'archive';
  }

  // Documents
  if (
    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'].includes(ext) ||
    mime.includes('officedocument') ||
    mime.includes('msword') ||
    mime.includes('ms-excel') ||
    mime.includes('ms-powerpoint')
  ) {
    return 'document';
  }

  // Structured Data
  if (
    ['json', 'yaml', 'yml', 'xml', 'csv', 'tsv', 'graphql', 'proto'].includes(ext) ||
    ['application/json', 'application/xml', 'text/csv'].includes(mime)
  ) {
    return 'data';
  }

  // Source Code
  if (
    [
      'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
      'py', 'ipynb',
      'html', 'htm', 'css', 'scss', 'sass', 'less',
      'java', 'kt', 'kts',
      'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
      'cs', 'go', 'rs', 'php', 'rb', 'swift', 'scala',
      'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
      'sql', 'prisma',
      'dockerfile', 'makefile', 'r', 'lua', 'dart'
    ].includes(ext)
  ) {
    return 'code';
  }

  // Plain Text / Notes / Config
  if (
    ['txt', 'md', 'markdown', 'log', 'env', 'example', 'gitignore', 'editorconfig', 'license'].includes(ext) ||
    mime.startsWith('text/')
  ) {
    return 'text';
  }

  return 'other';
}

/**
 * Block dangerous executable binaries and script payloads from file uploads
 */
const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'com', 'scr', 'vbs', 'wsf', 'msi', 'jar', 'pif', 'hta', 'cpl', 'iso', 'img', 'vhd'
]);

export function isDangerousFileExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return DANGEROUS_EXTENSIONS.has(ext);
}

/**
 * Sanitizes a file name to prevent directory traversal or malformed characters
 */
export function sanitizeFileName(name: string): string {
  if (!name) return 'file';
  return name
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 150);
}

/**
 * Check if the file category is safe and suitable for inline text/code rendering
 */
export function isTextOrCodeCategory(category: FileCategory): boolean {
  return category === 'code' || category === 'text' || category === 'data';
}
