// =============================================================================
// USE VIDEO GENERATION HOOK
// =============================================================================

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { generateApiService } from "@/services/api";
import {
  setCaption,
  setLoading,
  setLoadingMsg,
  setProgressValue,
  setPrompts,
  setResults,
  setScript,
  setStep,
  setUploadedImageUrls,
} from "@/store/videoGeneratorSlice";
import { mapUploadError, mapGenerateError } from "../_utils/errorMapper";
import { buildSampleCaption } from "../_utils/captionBuilder";
import { generateJobId } from "../_utils/fileUtils";
import { TOAST_MESSAGES, ERROR_MESSAGES } from "../_constants";
import type { VideoGeneratorState, ProgressEvent, CountLimits } from "../_types";

interface UseVideoGenerationReturn {
  // Actions
  handleProcessImages: (files: File[], productName: string) => Promise<void>;
  handleGenerateVideo: () => Promise<void>;
  
  // State helpers
  isLoading: boolean;
  canGenerate: boolean;
}

/**
 * Hook untuk mengelola video generation flow (upload → analyze → generate)
 */
export function useVideoGeneration(countLimits: CountLimits): UseVideoGenerationReturn {
  const dispatch = useDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Get state dari Redux
  const {
    loading,
    uploadedImageUrls,
    productName,
    prompts,
    script,
    targetCount,
    voiceGender,
  } = useSelector((state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator);

  /**
   * Cleanup SSE connection
   */
  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("🔌 SSE Closed");
    }
  }, []);

  /**
   * Setup SSE connection untuk progress tracking
   */
  const setupSSE = useCallback((jobId: string) => {
    const progressUrl = generateApiService.getProgressUrl(jobId);
    console.log("🔌 Connecting to SSE:", progressUrl);

    const eventSource = new EventSource(progressUrl, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("✅ SSE Connected");
    };

    eventSource.onmessage = (event) => {
      try {
        console.log("📡 SSE Raw:", event.data);
        const parsed = JSON.parse(event.data);
        
        // Handle nested data structure: {"data": {"message": "...", "progress": 5}}
        const progressData: ProgressEvent = parsed.data || parsed;
        
        console.log("📡 SSE Parsed:", progressData);

        if (progressData.message) {
          dispatch(setLoadingMsg(progressData.message));
        }

        if (progressData.progress !== undefined && progressData.progress !== null) {
          dispatch(setProgressValue(progressData.progress));
        }
      } catch (err) {
        console.error("❌ Error parsing SSE:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE Error:", error);
      // EventSource will auto-reconnect
    };

    return eventSource;
  }, [dispatch]);

  /**
   * Step 1 → 2: Upload images dan analyze
   */
  const handleProcessImages = useCallback(async (files: File[], productName: string) => {
    // Validation
    if (files.length === 0) {
      toast.error(TOAST_MESSAGES.NO_FILES);
      return;
    }
    if (!productName.trim()) {
      toast.error(TOAST_MESSAGES.NO_PRODUCT_NAME);
      return;
    }

    dispatch(setLoading(true));
    const uploadToastId = toast.loading(TOAST_MESSAGES.UPLOADING);

    try {
      // 1. Upload images
      const urls = await generateApiService.uploadImages(files);
      dispatch(setUploadedImageUrls(urls));

      toast.dismiss(uploadToastId);
      const analyzeToastId = toast.loading(TOAST_MESSAGES.ANALYZING);
      dispatch(setLoadingMsg(TOAST_MESSAGES.ANALYZING));

      // 2. Analyze image
      const data = await generateApiService.analyzeImage({
        imageUrl: urls[0],
        productName: productName,
        promptCount: urls.length,
      });

      const { voiceover, videoPrompts, captionComponents } = data;

      // 3. Update state
      dispatch(setScript(voiceover));
      dispatch(setPrompts(videoPrompts));

      // 4. Build sample caption
      const sampleCaption = buildSampleCaption(captionComponents);
      dispatch(setCaption(sampleCaption));

      toast.dismiss(analyzeToastId);
      toast.success(TOAST_MESSAGES.ANALYZE_SUCCESS);
      dispatch(setStep(2));

    } catch (error) {
      console.error("Process images error:", error);
      toast.dismiss(uploadToastId);
      toast.error(mapUploadError(error), { duration: 5000 });
    } finally {
      dispatch(setLoading(false));
      dispatch(setLoadingMsg(""));
    }
  }, [dispatch]);

  /**
   * Step 2 → 3 → 4: Generate videos dengan SSE progress
   */
  const handleGenerateVideo = useCallback(async () => {
    // Validation
    if (targetCount < countLimits.min || targetCount > countLimits.max) {
      toast.error(`Jumlah variasi harus antara ${countLimits.min} - ${countLimits.max}`);
      return;
    }

    // Setup state
    dispatch(setStep(3));
    dispatch(setLoading(true));
    dispatch(setProgressValue(0));
    dispatch(setLoadingMsg(TOAST_MESSAGES.STARTING_ENGINE));

    const generatingToastId = toast.loading(`Generating ${targetCount} videos...`);
    const jobId = generateJobId();

    try {
      // 1. Setup SSE untuk progress tracking
      setupSSE(jobId);

      // 2. Call generate API
      const resultData = await generateApiService.generateVideo({
        images: uploadedImageUrls,
        productName: productName,
        prompts: prompts,
        script: script,
        targetCount: Number(targetCount),
        jobId: jobId,
        voiceGender: voiceGender,
      });

      // 3. Cleanup dan update state
      cleanupSSE();
      dispatch(setProgressValue(100));
      dispatch(setResults(resultData.variations));
      dispatch(setStep(4));

      toast.dismiss(generatingToastId);
      toast.success(`${resultData.variations.length} video berhasil dibuat!`, { duration: 4000 });

    } catch (error) {
      console.error("Generate video error:", error);
      cleanupSSE();
      
      toast.dismiss(generatingToastId);
      toast.error(mapGenerateError(error), { duration: 5000 });
      
      // Kembali ke step 2 untuk retry
      dispatch(setStep(2));
    } finally {
      dispatch(setLoading(false));
      dispatch(setProgressValue(0));
      dispatch(setLoadingMsg(""));
    }
  }, [
    dispatch,
    countLimits,
    targetCount,
    uploadedImageUrls,
    productName,
    prompts,
    script,
    voiceGender,
    setupSSE,
    cleanupSSE,
  ]);

  return {
    handleProcessImages,
    handleGenerateVideo,
    isLoading: loading,
    canGenerate: prompts.length > 0 && script.length > 0,
  };
}