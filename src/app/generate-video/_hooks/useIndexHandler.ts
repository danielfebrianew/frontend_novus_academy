// =============================================================================
// USE IMAGE HANDLER HOOK
// =============================================================================

import { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { 
  setCropperImgSrc, 
  setCropperOpen 
} from "@/store/videoGeneratorSlice";
import { blobToFile, readFileAsDataUrl } from "../_utils/fileUtils";
import { TOAST_MESSAGES } from "../_utils/constants";

interface UseImageHandlerReturn {
  // State
  selectedFile: File | null;
  readyFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  
  // Actions
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCropFinished: (croppedBlob: Blob) => void;
  removeFile: (index: number) => void;
  clearAllFiles: () => void;
  
  // Helpers
  hasFiles: boolean;
  fileCount: number;
}

/**
 * Hook untuk mengelola image selection, cropping, dan file management
 */
export function useImageHandler(): UseImageHandlerReturn {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state untuk files
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [readyFiles, setReadyFiles] = useState<File[]>([]);

  /**
   * Handle file selection dari input
   */
  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      dispatch(setCropperImgSrc(dataUrl));
      dispatch(setCropperOpen(true));
    } catch (error) {
      console.error("Failed to read file:", error);
      toast.error("Gagal membaca file");
    }

    // Reset input supaya bisa select file yang sama
    e.target.value = "";
  }, [dispatch]);

  /**
   * Handle crop completion
   */
  const onCropFinished = useCallback((croppedBlob: Blob) => {
    if (!selectedFile) return;

    const croppedFile = blobToFile(croppedBlob, selectedFile.name);
    setReadyFiles(prev => [...prev, croppedFile]);
    
    toast.success(TOAST_MESSAGES.CROP_SUCCESS);
    dispatch(setCropperOpen(false));
    setSelectedFile(null);
  }, [selectedFile, dispatch]);

  /**
   * Remove file by index
   */
  const removeFile = useCallback((index: number) => {
    setReadyFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Clear all files
   */
  const clearAllFiles = useCallback(() => {
    setReadyFiles([]);
    setSelectedFile(null);
  }, []);

  return {
    // State
    selectedFile,
    readyFiles,
    fileInputRef,
    
    // Actions
    onSelectFile,
    onCropFinished,
    removeFile,
    clearAllFiles,
    
    // Helpers
    hasFiles: readyFiles.length > 0,
    fileCount: readyFiles.length,
  };
}