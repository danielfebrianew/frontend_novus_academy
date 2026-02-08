// =============================================================================
// VIDEO GENERATOR CONSTANTS
// =============================================================================

import type { CountLimits } from "../_types";

// --- Toast Messages ---
export const TOAST_MESSAGES = {
  // Success
  CROP_SUCCESS: "Foto berhasil dipotong!",
  ANALYZE_SUCCESS: "Analisa Selesai!",
  CAPTION_COPIED: "Caption disalin!",
  
  // Loading
  UPLOADING: "Mengupload gambar...",
  ANALYZING: "Menganalisa gambar & membuat aset...",
  STARTING_ENGINE: "Memulai AI Engine...",
  
  // Validation
  NO_FILES: "Belum ada foto yang dipilih!",
  NO_PRODUCT_NAME: "Nama produk wajib diisi!",
} as const;

// --- Error Messages ---
export const ERROR_MESSAGES = {
  // Upload errors
  FILE_TOO_LARGE: "File terlalu besar. Maksimal 5MB per gambar.",
  UNSUPPORTED_FORMAT: "Format file tidak didukung. Gunakan JPG/PNG.",
  SERVER_ERROR: "Server sedang bermasalah. Coba lagi nanti.",
  CONNECTION_ERROR: "Tidak dapat terhubung ke server. Periksa koneksi internet.",
  
  // Generate errors
  TIMEOUT: "Request timeout. Video terlalu banyak atau server sibuk.",
  GENERATE_SERVER_ERROR: "Server error saat generate video. Coba kurangi jumlah variasi.",
  RATE_LIMIT: "Terlalu banyak request. Tunggu beberapa menit.",
  CONNECTION_LOST: "Koneksi terputus. Periksa internet dan coba lagi.",
  
  // Default
  PROCESS_FAILED: "Gagal memproses gambar",
  GENERATE_FAILED: "Gagal Generate Video",
} as const;

// --- Error Code Mapping ---
export const ERROR_CODE_MAP: Record<string, string> = {
  "413": ERROR_MESSAGES.FILE_TOO_LARGE,
  "415": ERROR_MESSAGES.UNSUPPORTED_FORMAT,
  "500": ERROR_MESSAGES.SERVER_ERROR,
  "429": ERROR_MESSAGES.RATE_LIMIT,
  "Failed to fetch": ERROR_MESSAGES.CONNECTION_ERROR,
  "timeout": ERROR_MESSAGES.TIMEOUT,
  "AbortError": ERROR_MESSAGES.TIMEOUT,
};

// --- Count Limits by Prompt Count ---
export const COUNT_LIMITS_CONFIG: Record<number, CountLimits> = {
  4: { min: 1, max: 20, default: 5 },
  5: { min: 1, max: 50, default: 10 },
  6: { min: 1, max: 100, default: 15 },
};

export const DEFAULT_COUNT_LIMITS: CountLimits = {
  min: 1,
  max: 20,
  default: 5
};

// --- Voice Gender Options ---
export const VOICE_OPTIONS = [
  { value: 'female', label: 'Wanita (Female) - Rekomendasi' },
  { value: 'male', label: 'Pria (Male)' },
] as const;

// --- File Config ---
export const FILE_CONFIG = {
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ACCEPTED_EXTENSIONS: '.jpg,.jpeg,.png',
  MAX_SIZE_MB: 5,
  CROP_ASPECT_RATIO: 9 / 16,
} as const;

export const TARGET_RATIO = 9 / 16;