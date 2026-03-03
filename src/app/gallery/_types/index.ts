// src/app/gallery/_types/index.ts

// Generic API response wrapper
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

// Single video file
export interface VideoResult {
  id: string;
  variationNumber: number;
  videoUrl: string;
  fileName: string;
  isScheduled: boolean;
  scheduledAt: string | null;
  createdAt: string;
}

// Job card di grid view
export interface GalleryJobSummary {
  id: string;
  jobId: string;
  productName: string;
  thumbnailUrl: string | null;
  videoCount: number;
  voiceGender: "male" | "female" | null;
  isPro: boolean;
  status: "processing" | "success" | "fail" | "failed";
  createdAt: string;
}

// Job detail di modal
export interface VideoJobDetail {
  id: string;
  jobId: string;
  productName: string;
  script: string;
  voiceGender: "male" | "female" | null;
  promptCount: number;
  targetCount: number;
  prompts: string[];
  inputImages: string[];
  thumbnailUrl: string | null;
  isPro: boolean;
  status: "processing" | "success" | "fail" | "failed";
  failMsg: string | null;
  createdAt: string;
  videos: VideoResult[];
}

// Response wrapper untuk list jobs
export interface GalleryResponse {
  jobs: GalleryJobSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}