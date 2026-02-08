// =============================================================================
// GENERATE VIDEO API SERVICE
// =============================================================================

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
// HELPER: Upload Images
// ============================================================================
const uploadFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const token = authService.getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/generate/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

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

  const body: UploadApiResponse = await response.json();

  if (body.data && body.data.imageUrls) {
    return body.data.imageUrls;
  }

  throw new Error("Gagal mendapatkan URL gambar");
};

// ============================================================================
// HELPER: Analyze Image
// ============================================================================
const analyzeImageData = async (payload: AnalyzeRequest) => {
  const token = authService.getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/generate/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      promptCount: 4,
      ...payload
    }),
  });

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

  const body: AnalyzeApiResponse = await response.json();
  return body.data;
};

// ============================================================================
// HELPER: Generate Video
// ============================================================================
const generateVideoData = async (payload: GenerateVideoRequest) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 menit

  try {
    const token = authService.getAccessToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/generate/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    const body: GenerateVideoApiResponse = await response.json();
    return body.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout setelah 15 menit');
    }
    throw error;
  }
};

// ============================================================================
// EXPORT: API Service
// ============================================================================
export const generateApiService = {
  uploadImages: uploadFiles,
  analyzeImage: analyzeImageData,
  generateVideo: generateVideoData,

  // SSE Progress URL (EventSource doesn't support headers, so pass token via query param)
  getProgressUrl: (jobId: string) => {
    const token = authService.getAccessToken();
    const url = `${API_BASE_URL}/api/v1/generate/progress/${jobId}`;
    return token ? `${url}?token=${token}` : url;
  }
};
