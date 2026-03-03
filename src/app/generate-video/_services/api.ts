import {
  UploadApiResponse,
  AnalyzeRequest,
  AnalyzeApiResponse,
  GenerateVideoRequest,
  GenerateVideoApiResponse
} from "../_types";
import { authService } from "@/lib/authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ============================================================================
// HELPER: DRY Error Handler
// ============================================================================
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }
  return response.json();
};

// ============================================================================
// HELPER: Auth Header Builder
// ============================================================================
const getAuthHeaders = (isJson = false) => {
  const token = authService.getAccessToken();
  const headers: HeadersInit = {};
  
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isJson) headers['Content-Type'] = 'application/json';
  
  return headers;
};

// ============================================================================
// SERVICES
// ============================================================================
export const generateApiService = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_BASE_URL}/api/v1/generate/upload`, {
      method: 'POST',
      headers: getAuthHeaders(), // <-- Jauh lebih bersih
      body: formData,
    });

    const body = await handleResponse<UploadApiResponse>(response); // <-- Error handling 1 baris
    
    if (body.data?.imageUrls) return body.data.imageUrls;
    throw new Error("Gagal mendapatkan URL gambar");
  },

  analyzeImage: async (payload: AnalyzeRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate/text`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ promptCount: 4, ...payload }),
    });

    const body = await handleResponse<AnalyzeApiResponse>(response);
    return body.data;
  },

  generateVideo: async (payload: GenerateVideoRequest) => {
    try {
      // Menggunakan API Timeout modern (kalau jalan di environment modern)
      // Kalau browser/node lawas error, tetap pakai AbortController & setTimeout kamu yang sebelumnya ya!
      const response = await fetch(`${API_BASE_URL}/api/v1/generate/video`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(900000) // 15 Menit langsung di 1 baris
      });

      const body = await handleResponse<GenerateVideoApiResponse>(response);
      return body.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('Request timeout setelah 15 menit');
      }
      throw error;
    }
  },

  getProgressUrl: (jobId: string) => {
    const token = authService.getAccessToken();
    const url = `${API_BASE_URL}/api/v1/generate/progress/${jobId}`;
    return token ? `${url}?token=${token}` : url;
  }
};