/**
 * LEGACYCAPSULE — Image Utilities
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 *
 * CLIENT-SIDE ONLY. Runs in the browser before upload.
 * Never import this file in server-side code or API routes.
 *
 * Purpose: Capture pixel dimensions from a File object before it is
 * uploaded to Supabase Storage. The dimensions are stored alongside
 * the image_url in gallery_items so the auto-arrangement algorithm
 * can make slot-type decisions (landscape → double, portrait → triple).
 *
 * Usage in upload handlers:
 *   import { getImageDimensions, getImageMetadata } from '@/lib/imageUtils'
 *
 *   const meta = await getImageMetadata(file)
 *   await supabase.from('gallery_items').insert({
 *     capsule_id, phase_id, image_url,
 *     width_px: meta.width,
 *     height_px: meta.height,
 *     // aspect_ratio is a generated column — do NOT insert it
 *   })
 */

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata extends ImageDimensions {
  /** width / height — same value as the Supabase generated column */
  aspectRatio: number | null;
  /** 'landscape' | 'portrait' | 'square' — derived from aspect ratio */
  orientation: 'landscape' | 'portrait' | 'square';
  /** File size in bytes */
  sizeBytes: number;
  /** MIME type from the File object */
  mimeType: string;
}

// ────────────────────────────────────────────────────────────
// CONSTANTS — match the thresholds in autoArrange.ts
// ────────────────────────────────────────────────────────────

const LANDSCAPE_THRESHOLD = 1.2;
const PORTRAIT_THRESHOLD = 0.85;

/** Accepted image MIME types. Reject anything outside this list at upload time. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/** Maximum file size accepted for gallery upload (bytes). 20 MB. */
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

/** Maximum file size for hero/profile images. 10 MB. */
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;


// ────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ────────────────────────────────────────────────────────────

/**
 * Read the natural pixel dimensions of an image File.
 *
 * Creates a temporary object URL, loads it into an <img> element,
 * reads naturalWidth and naturalHeight, then immediately revokes the URL.
 *
 * Resolves with dimensions on success.
 * Rejects if the file cannot be read as an image.
 *
 * @param file  The File object from an <input type="file"> or drag-drop
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error(`Image dimensions are zero — file may be corrupt: ${file.name}`));
        return;
      }

      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read image dimensions: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Read full metadata from an image File — dimensions, orientation, size, type.
 *
 * This is the preferred function to call in upload handlers.
 * It captures everything needed for the gallery_items insert in one call.
 *
 * @param file  The File object from an <input type="file"> or drag-drop
 */
export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  const { width, height } = await getImageDimensions(file);

  const aspectRatio = height > 0 ? width / height : null;

  let orientation: ImageMetadata['orientation'] = 'square';
  if (aspectRatio !== null) {
    if (aspectRatio > LANDSCAPE_THRESHOLD) orientation = 'landscape';
    else if (aspectRatio < PORTRAIT_THRESHOLD) orientation = 'portrait';
  }

  return {
    width,
    height,
    aspectRatio,
    orientation,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}

/**
 * Validate an image file before upload.
 *
 * Returns null on success. Returns an error message string on failure.
 * The upload handler should display this message to the organiser.
 *
 * Checks:
 *   - File type is in ACCEPTED_IMAGE_TYPES
 *   - File size is within the specified limit
 *
 * @param file      The File object to validate
 * @param maxBytes  Size limit in bytes (default: MAX_IMAGE_SIZE_BYTES)
 */
export function validateImageFile(
  file: File,
  maxBytes: number = MAX_IMAGE_SIZE_BYTES
): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
    return `File type not accepted: ${file.type || 'unknown'}. Please upload a JPEG, PNG, WEBP, or HEIC image.`;
  }

  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File too large: ${fileMB} MB. Maximum size is ${maxMB} MB.`;
  }

  return null;
}

/**
 * Generate a storage path for a gallery image.
 *
 * Path format: `gallery/{capsuleId}/{phaseId}/{timestamp}_{filename}`
 * The timestamp prefix ensures uniqueness even if the same filename is uploaded twice.
 * The phase prefix keeps phase-specific photos grouped in storage.
 *
 * @param capsuleId  UUID of the capsule
 * @param phaseId    UUID of the phase (or 'unphased' if no phase)
 * @param file       The File object (for its name)
 */
export function buildGalleryStoragePath(
  capsuleId: string,
  phaseId: string | null,
  file: File
): string {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const phase = phaseId ?? 'unphased';
  return `gallery/${capsuleId}/${phase}/${timestamp}_${safeName}`;
}

/**
 * Generate a storage path for a cover / hero image.
 *
 * Path format: `covers/{capsuleId}/{timestamp}_{filename}`
 *
 * @param capsuleId  UUID of the capsule
 * @param file       The File object
 */
export function buildCoverStoragePath(capsuleId: string, file: File): string {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `covers/${capsuleId}/${timestamp}_${safeName}`;
}

/**
 * Generate a storage path for a honouree profile photo.
 *
 * Path format: `profiles/{capsuleId}/{timestamp}_{filename}`
 *
 * @param capsuleId  UUID of the capsule
 * @param file       The File object
 */
export function buildProfileStoragePath(capsuleId: string, file: File): string {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `profiles/${capsuleId}/${timestamp}_${safeName}`;
}
