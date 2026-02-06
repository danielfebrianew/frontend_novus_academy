// =============================================================================
// ERROR MAPPER UTILITIES
// =============================================================================

import { ERROR_CODE_MAP, ERROR_MESSAGES } from "../_constants";

type ErrorContext = 'upload' | 'generate';

/**
 * Map error ke user-friendly message berdasarkan context
 * @param error - Error object atau unknown
 * @param context - Context error (upload atau generate)
 * @returns string - User-friendly error message
 */
export function mapErrorMessage(error: unknown, context: ErrorContext): string {
  const defaultMessage = context === 'upload' 
    ? ERROR_MESSAGES.PROCESS_FAILED 
    : ERROR_MESSAGES.GENERATE_FAILED;

  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  const errorMessage = error.message;

  // Check against error code map
  for (const [key, message] of Object.entries(ERROR_CODE_MAP)) {
    if (errorMessage.includes(key)) {
      // Special handling untuk generate context
      if (context === 'generate') {
        if (key === '500') return ERROR_MESSAGES.GENERATE_SERVER_ERROR;
        if (key === 'Failed to fetch') return ERROR_MESSAGES.CONNECTION_LOST;
      }
      return message;
    }
  }

  // Jika tidak match, return error message asli atau default
  return errorMessage || defaultMessage;
}

/**
 * Map upload-specific errors
 * @param error - Error object
 * @returns string - User-friendly error message
 */
export function mapUploadError(error: unknown): string {
  return mapErrorMessage(error, 'upload');
}

/**
 * Map generate-specific errors
 * @param error - Error object
 * @returns string - User-friendly error message
 */
export function mapGenerateError(error: unknown): string {
  return mapErrorMessage(error, 'generate');
}

/**
 * Check apakah error adalah network error
 * @param error - Error object
 * @returns boolean
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const networkIndicators = [
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'ERR_NETWORK',
  ];
  
  return networkIndicators.some(indicator => 
    error.message.includes(indicator)
  );
}

/**
 * Check apakah error adalah timeout
 * @param error - Error object
 * @returns boolean
 */
export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  return error.message.includes('timeout') || 
         error.message.includes('AbortError') ||
         error.name === 'AbortError';
}