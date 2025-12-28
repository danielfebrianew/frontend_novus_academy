import axios from "axios";
import { 
  UploadResponse, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  GenerateVideoRequest, 
  GenerateVideoResponse 
} from "@/types/api";

// Sesuai endpoint kamu: {{baseURL}}/api/v1/generate
const API_BASE_URL = "http://localhost:3000/api/v1/generate";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiService = {
  // 1. Upload Images
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await apiClient.post<UploadResponse>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Struktur Respon: { statusCode, message, data: { imageUrls: [...] } }
    // Kita ambil: imageUrls
    const body = res.data;
    if (body.data && body.data.imageUrls) {
      return body.data.imageUrls;
    }
    throw new Error("Gagal mendapatkan URL gambar");
  },

  // 2. Analyze Image (Generate Text)
  analyzeImage: async (payload: AnalyzeRequest) => {
    const res = await apiClient.post<AnalyzeResponse>("/text", {
      promptCount: 4, // default fallback
      ...payload
    });

    // Struktur Respon: { statusCode, message, data: { voiceover, videoPrompts... } }
    // Kita return object 'data' agar frontend bisa destructure { voiceover, videoPrompts }
    return res.data.data; 
  },

  // 3. Generate Video
  generateVideo: async (payload: GenerateVideoRequest) => {
    const res = await apiClient.post<GenerateVideoResponse>("/video", payload, {
      timeout: 900000, // 15 menit
    });

    // Struktur Respon: { statusCode, message, data: { variations: [...], jobId } }
    // Kita return object 'data' agar frontend bisa akses .variations
    return res.data.data;
  },

  // Helper untuk URL SSE
  getProgressUrl: (jobId: string) => {
    // Endpoint progress biasanya di root controller atau path spesifik
    // Sesuaikan jika progress ada di /api/v1/generate/progress/:jobId
    return `${API_BASE_URL}/progress/${jobId}`;
  }
};