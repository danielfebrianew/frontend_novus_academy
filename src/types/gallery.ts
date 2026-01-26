// 1. Single video file shape
export interface VideoResult {
  id: string;
  variationNumber: number;
  videoUrl: string;
  fileName: string;
  isScheduled: boolean;
  scheduledAt: string | null;
  createdAt: string;
}

// 2. Job shape for the GRID VIEW (The API returns 'videoCount', not 'targetCount')
export interface GalleryJobSummary {
  id: string;
  jobId: string;
  productName: string;
  thumbnailUrl: string | null;
  videoCount: number; // ✅ This is what JobCard needs
  voiceGender: 'male' | 'female';
  createdAt: string;
}

// 3. Job shape for the DETAIL MODAL
export interface VideoJobDetail {
  id: string;
  jobId: string;
  productName: string;
  script: string;
  voiceGender: 'male' | 'female';
  promptCount: number;
  targetCount: number;
  prompts: string[];
  inputImages: string[];
  thumbnailUrl: string | null;
  createdAt: string;
  videos: VideoResult[];
}

// 4. API Response wrapper
export interface GalleryResponse {
  jobs: GalleryJobSummary[]; 
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}