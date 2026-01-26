// =============================================================================
// VIDEO GENERATOR TYPES
// =============================================================================

// --- API Payloads ---
export interface AnalyzePayload {
  imageUrl: string;
  productName: string;
  promptCount: number;
}

export interface GeneratePayload {
  images: string[];
  prompts: string[];
  script: string;
  targetCount: number;
  jobId: string;
  voiceGender: VoiceGender;
}

// --- API Responses ---
export interface AnalyzeResponse {
  voiceover: string;
  videoPrompts: string[];
  captionComponents: CaptionComponents;
}

export interface GenerateResponse {
  variations: string[];
}

export interface CaptionComponents {
  hooks: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[][];
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