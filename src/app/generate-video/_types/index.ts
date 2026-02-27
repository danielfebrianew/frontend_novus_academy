// =============================================================================
// VIDEO GENERATOR TYPES
// =============================================================================

// --- Generic API Response Wrapper ---
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

// --- API Payloads ---
export interface AnalyzePayload {
  imageUrl: string;
  productName: string;
  promptCount: number;
}

export interface GeneratePayload {
  images: string[];
  productName: string;
  prompts: string[];
  script: string;
  targetCount: number;
  jobId: string;
  voiceGender: VoiceGender;
}

// --- API Responses ---
export interface CaptionComponents {
  hooks: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[][];
}

export interface AnalyzeResponse {
  voiceover: string;
  videoPrompts: string[];
  captionComponents: CaptionComponents;
}

export interface VideoVariation {
  variationIndex: number;
  videoUrl: string;
  thumbnailUrl: string;
}

export interface GenerateResponse {
  jobId: string;
  totalVariations: number;
  videos: VideoVariation[];
}

// --- API Response types (full wrapped responses used by service layer) ---
export interface UploadApiResponse extends ApiResponse<{
  imageUrls: string[];
}> {}

export interface AnalyzeApiResponse extends ApiResponse<{
  voiceover: string;
  videoPrompts: string[];
  captionComponents: CaptionComponents;
}> {}

export interface GenerateVideoApiResponse extends ApiResponse<{
  jobId: string;
  totalVariations: number;
  videos: VideoVariation[];
}> {}

export interface AnalyzeRequest {
  imageUrl: string;
  productName: string;
  productDescription?: string;
  promptCount?: number;
}

export interface GenerateVideoRequest {
  images: string[];
  productName: string;
  prompts: string[];
  script: string;
  jobId: string;
  targetCount: number;
  voiceGender: string;
}

// --- State & Config ---
export type VoiceGender = 'male' | 'female';

export type GeneratorStep = 1 | 2 | 3 | 4;

export interface CountLimits {
  min: number;
  max: number;
  default: number;
}

// --- SSE Progress ---
export interface ProgressEvent {
  message?: string;
  progress?: number;
}

// --- Redux State (for reference) ---
export interface VideoGeneratorState {
  step: GeneratorStep;
  loading: boolean;
  loadingMsg: string;
  progressValue: number;
  uploadedImageUrls: string[];
  productName: string;
  productDescription: string;
  script: string;
  caption: string;
  prompts: string[];
  results: string[];
  cropperOpen: boolean;
  cropperImgSrc: string | null;
  targetCount: number;
  voiceGender: VoiceGender;
}

export interface ImageFile {
  id: string;
  file: File;
  originalUrl: string;
  croppedUrl: string;
  cropData: CropData;
}

export interface CropData {
  x: number;
  y: number;
  scale: number;
}

export interface StepUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesReady: (files: File[]) => void;
  onProcessImages: () => void;
  isLoading: boolean;
}