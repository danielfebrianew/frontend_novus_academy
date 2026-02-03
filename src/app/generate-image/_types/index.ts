// ─── Interfaces (match API response) ─────────────────────────────────────────

export interface ImageVariant {
  variantNumber: number;
  title: string;
  prompt: string;
  imageUrl: string | null;
  error: string | null;
  createdAt: string;
}

export interface GenerationData {
  jobId: string;
  productName: string;
  productDescription: string;
  category: string;
  background: string;
  totalVariants: number;
  successfulVariants: number;
  failedVariants: number;
  variants: ImageVariant[];
  processingTime: number;
}

export interface ApiResponse {
  statusCode: number;
  message: string;
  data: GenerationData;
}