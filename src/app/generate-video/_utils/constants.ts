// =============================================================================
// VIDEO GENERATOR CONSTANTS
// =============================================================================

import type { CountLimits } from "../_types";

// --- Toast Messages ---
export const TOAST_MESSAGES = {
  // Success
  CROP_SUCCESS: "Foto berhasil dipotong!",
  ANALYZE_SUCCESS: "Analisa selesai!",
  CAPTION_COPIED: "Caption disalin ke clipboard!",
  
  // Loading
  UPLOADING: "Mengupload gambar...",
  ANALYZING: "Menganalisa gambar & meracik aset...",
  STARTING_ENGINE: "Memanaskan AI Engine...",
  
  // Validation
  NO_FILES: "Ups, belum ada foto yang dipilih nih!",
  NO_PRODUCT_NAME: "Nama produk wajib diisi ya!",
} as const;

// --- Error Messages ---
export const ERROR_MESSAGES = {
  // Upload errors
  FILE_TOO_LARGE: "Ukuran fotonya kegedean! Pastikan maksimal 5MB ya.",
  UNSUPPORTED_FORMAT: "Format foto nggak didukung. Tolong pakai JPG atau PNG.",
  
  // Generate & Server errors
  SERVER_ERROR: "Server kita lagi kewalahan nih. Coba beberapa saat lagi ya.",
  GENERATE_SERVER_ERROR: "Gagal merender video. Coba kurangi jumlah variasinya.",
  RATE_LIMIT: "Kamu generate terlalu cepat. Santai dulu beberapa menit yuk.",
  
  // Network errors
  CONNECTION_LOST: "Koneksi terputus nih. Coba cek Wi-Fi/kuota internet kamu dan ulangi ya.",
  TIMEOUT: "Prosesnya butuh waktu terlalu lama. Boleh coba generate ulang?",
  TIMEOUT_ERROR: "Prosesnya butuh waktu terlalu lama. Boleh coba generate ulang?",

  // Default fallbacks
  PROCESS_FAILED: "Duh, proses upload gagal. Coba cek gambarmu lagi.",
  GENERATE_FAILED: "Waduh, gagal memproses videonya. Coba sesaat lagi ya.",
  UNKNOWN_ERROR: "Terjadi kesalahan yang tidak diketahui. Coba ulangi lagi ya.",
} as const;

// --- Error Code Mapping ---
export const ERROR_CODE_MAP: Record<string, string> = {
  "413": ERROR_MESSAGES.FILE_TOO_LARGE,
  "415": ERROR_MESSAGES.UNSUPPORTED_FORMAT,
  "429": ERROR_MESSAGES.RATE_LIMIT,
  "500": ERROR_MESSAGES.SERVER_ERROR,
  "Failed to fetch": ERROR_MESSAGES.CONNECTION_LOST,
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
  { value: 'female', label: 'Wanita (Female)' },
  { value: 'male', label: 'Pria (Male)' },
] as const;

// --- File Config ---
export const FILE_CONFIG = {
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ACCEPTED_EXTENSIONS: '.jpg,.jpeg,.png',
  MAX_SIZE_MB: 5,
  CROP_ASPECT_RATIO: 9 / 16,
} as const;

export const TARGET_RATIO = FILE_CONFIG.CROP_ASPECT_RATIO;