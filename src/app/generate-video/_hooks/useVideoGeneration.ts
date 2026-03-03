// =============================================================================
// USE VIDEO GENERATION HOOK
// =============================================================================

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { generateApiService } from "../_services/api";
import {
  setLoading,
  setLoadingMsg,
  setProgressValue,
  setPrompts,
  setScript,
  setStep,
  setUploadedImageUrls,
} from "@/store/videoGeneratorSlice";
import { mapUploadError, mapGenerateError } from "../../../utils/errorMapper";
import { generateJobId } from "../_utils/fileUtils";
import { TOAST_MESSAGES } from "../_utils/constants";
import type { VideoGeneratorState, ProgressEvent, CountLimits } from "../_types";

interface UseVideoGenerationReturn {
  handleProcessImages: (files: File[], productName: string) => Promise<void>;
  handleGenerateVideo: () => Promise<void>;
  isLoading: boolean;
  canGenerate: boolean;
}

export function useVideoGeneration(countLimits: CountLimits): UseVideoGenerationReturn {
  const dispatch = useDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    loading,
    uploadedImageUrls,
    productName,
    productDescription,
    prompts,
    script,
    targetCount,
    voiceGender,
  } = useSelector((state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator);

  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const setupSSE = useCallback((jobId: string) => {
    const progressUrl = generateApiService.getProgressUrl(jobId);
    const eventSource = new EventSource(progressUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const progressData: ProgressEvent = parsed.data || parsed;

        if (progressData.message) {
          dispatch(setLoadingMsg(progressData.message));
        }
        if (progressData.progress !== undefined && progressData.progress !== null) {
          dispatch(setProgressValue(progressData.progress));
        }
      } catch (err) {
        console.error("Error parsing SSE:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
    };

    return eventSource;
  }, [dispatch]);

  const handleProcessImages = useCallback(async (files: File[], productName: string) => {
    if (files.length === 0) {
      toast.error(TOAST_MESSAGES.NO_FILES);
      return;
    }
    if (!productName.trim()) {
      toast.error(TOAST_MESSAGES.NO_PRODUCT_NAME);
      return;
    }
    if (!productDescription.trim()) {
      toast.error("Masukkan deskripsi produk terlebih dahulu");
      return;
    }

    dispatch(setLoading(true));
    const uploadToastId = toast.loading(TOAST_MESSAGES.UPLOADING);

    try {
      const urls = await generateApiService.uploadImages(files);
      dispatch(setUploadedImageUrls(urls));

      toast.dismiss(uploadToastId);
      const analyzeToastId = toast.loading(TOAST_MESSAGES.ANALYZING);
      dispatch(setLoadingMsg(TOAST_MESSAGES.ANALYZING));

      const data = await generateApiService.analyzeImage({
        imageUrl: urls[0],
        productName: productName,
        productDescription: productDescription.trim(),
        promptCount: urls.length,
      });

      dispatch(setScript(data.voiceover));
      dispatch(setPrompts(data.videoPrompts));

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
  }, [dispatch, productDescription]);

  const handleGenerateVideo = useCallback(async () => {
    if (targetCount < countLimits.min || targetCount > countLimits.max) {
      toast.error(`Jumlah variasi harus antara ${countLimits.min} - ${countLimits.max}`);
      return;
    }

    dispatch(setStep(3));
    dispatch(setLoading(true));
    dispatch(setProgressValue(0));
    dispatch(setLoadingMsg(TOAST_MESSAGES.STARTING_ENGINE));

    // Trigger gallery refresh supaya card processing langsung muncul
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/v1/gallery/jobs"),
      undefined,
      { revalidate: true }
    );

    const jobId = generateJobId();

    try {
      setupSSE(jobId);

      await generateApiService.generateVideo({
        images: uploadedImageUrls,
        productName: productName,
        prompts: prompts,
        script: script,
        targetCount: Number(targetCount),
        jobId: jobId,
        voiceGender: voiceGender,
      });

      cleanupSSE();

      // Refresh gallery lagi setelah selesai supaya status update ke success
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/v1/gallery/jobs"),
        undefined,
        { revalidate: true }
      );

    } catch (error) {
      console.error("Generate video error:", error);
      cleanupSSE();
      toast.error(mapGenerateError(error), { duration: 5000 });
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