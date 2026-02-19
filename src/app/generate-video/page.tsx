// =============================================================================
// VIDEO GENERATOR PAGE - Main Orchestrator
// =============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";


// Hooks
import { useVideoGeneration } from "./_hooks/useVideoGeneration";
import { useCountLimits } from "./_hooks/useCountLimits";

// Components
import { ProductNameInput } from "./_components/ProductNameInput";

// Views
import { StepUpload } from "./_views/StepUpload";
import { StepReview } from "./_views/StepReview";
import { StepGenerating } from "./_views/StepGenerating";
import { StepResults } from "./_views/StepResults";

// Types
import type { VideoGeneratorState } from "./_types";

export default function VideoGeneratorPage() {
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [readyFiles, setReadyFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => setIsMounted(true), []);

  // Redux state
  const { step, loading, productName } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  // Custom hooks
  const { countLimits } = useCountLimits();
  const { handleProcessImages, handleGenerateVideo } = useVideoGeneration(countLimits);

  // Hydration guard
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Step 1: Upload & Crop */}
        {step === 1 && (
          <StepUpload
            fileInputRef={fileInputRef}
            onFilesReady={setReadyFiles}
            onProcessImages={() => handleProcessImages(readyFiles, productName)}
            isLoading={loading}
          />
        )}

        {/* Step 2: Review & Settings */}
        {step === 2 && (
          <StepReview
            countLimits={countLimits}
            onGenerateVideo={handleGenerateVideo}
          />
        )}

        {/* Step 3: Generating (Loading) */}
        {step === 3 && <StepGenerating />}

        {/* Step 4: Results */}
        {step === 4 && <StepResults />}
      </div>
    </div>
  );
}