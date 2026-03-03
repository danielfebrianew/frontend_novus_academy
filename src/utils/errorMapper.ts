// =============================================================================
// ERROR MAPPER UTILITIES
// =============================================================================

import { ERROR_CODE_MAP, ERROR_MESSAGES } from "../app/generate-video/_utils/constants";

type ErrorContext = 'upload' | 'generate';

/**
 * Check apakah error adalah network error (koneksi putus/gagal fetch)
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const networkIndicators = [
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'ERR_NETWORK',
  ];
  
  return networkIndicators.some(indicator => error.message.includes(indicator));
}

/**
 * Check apakah error adalah timeout (proses terlalu lama)
 */
export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  return error.message.includes('timeout') || 
         error.message.includes('AbortError') ||
         error.name === 'AbortError';
}

/**
 * Map error ke user-friendly message berdasarkan context
 */
export function mapErrorMessage(error: unknown, context: ErrorContext): string {
  const defaultMessage = context === 'upload' 
    ? ERROR_MESSAGES.PROCESS_FAILED 
    : ERROR_MESSAGES.GENERATE_FAILED;

  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  // 1. Prioritaskan pengecekan koneksi & timeout dulu
  if (isNetworkError(error)) return ERROR_MESSAGES.CONNECTION_LOST;
  if (isTimeoutError(error)) return ERROR_MESSAGES.TIMEOUT_ERROR;

  const errorMessage = error.message;

  // 2. Cek apakah ada di dalam kamus error code kita
  for (const [key, message] of Object.entries(ERROR_CODE_MAP)) {
    if (errorMessage.includes(key)) {
      // Special handling jika butuh beda perlakuan di context generate
      if (context === 'generate' && key === '500') {
        return ERROR_MESSAGES.GENERATE_SERVER_ERROR;
      }
      return message;
    }
  }

  // 3. Filter Error Teknis agar tidak lolos ke User
  // Kalau error message-nya berbau teknis (ada kata "TypeError", "Unexpected token", dll),
  // kita ganti jadi pesan default biar user nggak bingung.
  const isTechnicalError = errorMessage.includes('Type') || 
                           errorMessage.includes('token') ||
                           errorMessage.includes('JSON');
                           
  if (isTechnicalError) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Jika aman, kembalikan pesan asli (misal pesan dari backend yang udah user-friendly)
  // Kalau kosong, kembalikan default.
  return errorMessage || defaultMessage;
}

export function mapUploadError(error: unknown): string {
  return mapErrorMessage(error, 'upload');
}

export function mapGenerateError(error: unknown): string {
  return mapErrorMessage(error, 'generate');
}