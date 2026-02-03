// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Convert Blob to File dengan nama yang sudah di-sanitize
 * @param blob - Blob dari hasil crop
 * @param originalFileName - Nama file original
 * @returns File object yang siap diupload
 */
export function blobToFile(blob: Blob, originalFileName: string): File {
  const name = originalFileName || "image.jpg";
  const extension = name.substring(name.lastIndexOf('.')) || '.jpg';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
  
  // Sanitize: hanya alphanumeric dan dash
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '_');
  
  // Tambah timestamp untuk uniqueness
  const timestamp = Date.now();
  const finalName = `${cleanName}_${timestamp}${extension}`;
  
  return new File([blob], finalName, {
    lastModified: timestamp,
    type: blob.type || 'image/jpeg',
  });
}

/**
 * Read file sebagai Data URL (untuk preview/cropper)
 * @param file - File yang mau dibaca
 * @returns Promise<string> - Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result?.toString();
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Generate unique job ID untuk tracking
 * @returns string - Job ID dengan format JOB_timestamp
 */
export function generateJobId(): string {
  return `JOB_${Date.now()}`;
}

/**
 * Create object URL untuk preview (jangan lupa revoke setelah selesai)
 * @param file - File yang mau di-preview
 * @returns string - Object URL
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke object URL untuk cleanup memory
 * @param url - Object URL yang mau di-revoke
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}