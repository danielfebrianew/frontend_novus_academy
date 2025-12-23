// types/api.ts

export interface UploadResponse {
  data: {
    imageUrls: string[];
  };
}

export interface AnalyzeRequest {
  imageUrl: string;
  productName: string;
  promptCount?: number; // Field baru untuk menentukan jumlah prompt (4, 5, atau 6)
}

// Interface baru untuk struktur komponen caption dari Backend
export interface CaptionComponents {
  hooks: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[][]; // Array of Array string (karena hashtags dikelompokkan per set)
}

export interface AnalyzeResponse {
  data: {
    voiceover: string;
    videoPrompts: string[];
    captionComponents: CaptionComponents; // Menggantikan tiktokCaption
  };
}

export interface GenerateVideoRequest {
  images: string[];
  prompts: string[];
  script: string;
  jobId: string;
  targetCount: number;
  voiceGender: string;
}

export interface GenerateVideoResponse {
  // Kita sesuaikan dengan backend yang mengembalikan object { variations: [...] }
  // Namun karena format types ini menggunakan wrapper 'data' (Axios style), kita pertahankan strukturnya.
  data: {
    variations: string[];
    jobId?: string;
    totalVariations?: number;
  };
}

// Tipe untuk Progress SSE
export interface ProgressData {
  message?: string;
  progress?: number;
  status?: string;
}