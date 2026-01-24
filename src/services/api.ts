// services/api.ts

import { 
  UploadResponse, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  GenerateVideoRequest, 
  GenerateVideoResponse 
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ============================================================================
// HELPER: Upload Images
// ============================================================================
const uploadFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/api/v1/generate/upload`, {
    method: 'POST',
    credentials: 'include',
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

  const body: UploadResponse = await response.json();

  if (body.data && body.data.imageUrls) {
    return body.data.imageUrls;
  }
  
  throw new Error("Gagal mendapatkan URL gambar");
};

// ============================================================================
// HELPER: Analyze Image
// ============================================================================
const analyzeImageData = async (payload: AnalyzeRequest) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate/text`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

  const body: AnalyzeResponse = await response.json();
  return body.data;
};

// ============================================================================
// HELPER: Generate Video
// ============================================================================
const generateVideoData = async (payload: GenerateVideoRequest) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 menit

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate/video`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
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

    const body: GenerateVideoResponse = await response.json();
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
  // Upload Images
  uploadImages: uploadFiles,

  // Analyze Image
  analyzeImage: analyzeImageData,

  // Generate Video
  generateVideo: generateVideoData,

  // SSE Progress URL
  getProgressUrl: (jobId: string) => {
    return `${API_BASE_URL}/api/v1/generate/progress/${jobId}`;
  }
};