// types/api.ts

// Interface umum untuk response API
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

export interface UploadResponse extends ApiResponse<{
  imageUrls: string[];
}> {}

export interface AnalyzeRequest {
  imageUrl: string;
  productName: string;
  promptCount?: number; // Field untuk menentukan jumlah prompt (4, 5, atau 6)
}

// Interface untuk struktur komponen caption dari Backend
export interface CaptionComponents {
  hooks: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[][]; // Array of Array string (karena hashtags dikelompokkan per set)
}

export interface AnalyzeResponse extends ApiResponse<{
  voiceover: string;
  videoPrompts: string[];
  captionComponents: CaptionComponents;
}> {}

export interface GenerateVideoRequest {
  images: string[];
  productName: string;
  prompts: string[];
  script: string;
  jobId: string;
  targetCount: number;
  voiceGender: string;
}

export interface GenerateVideoResponse extends ApiResponse<{
  variations: string[];
  jobId?: string;
  totalVariations?: number;
}> {}

// Tipe untuk Progress SSE
export interface ProgressData {
  message?: string;
  progress?: number;
  status?: string;
}