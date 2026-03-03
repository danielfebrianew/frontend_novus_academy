'use client';

import { ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { VideoResultCard } from './_components/VideoResultCard';
import { ProVideoForm } from './_components/ProVideoForm';
import { ProgressStepper } from './_components/ProgressStepper';
import { GenerationStatus } from './_components/GenerationStatus';
import { PromptPreview } from './_components/PromptPreview';
import { useVideoGeneration } from './_hooks/useVideoGeneration';
import { COLORS } from './_utils/constants';

export default function GenerateProPage() {
  const {
    displayProgress,
    lastPositiveProgressRef,
    submitVideoJob,
    cleanupAndReset,
    activeJob,
    isCheckingActiveJob,
  } = useVideoGeneration();

  const isLoading = useSelector((s: RootState) => s.videoGeneratorPro.isLoading);
  const progressMsg = useSelector((s: RootState) => s.videoGeneratorPro.progressMsg);
  const generatedPrompt = useSelector((s: RootState) => s.videoGeneratorPro.generatedPrompt);
  const resultUrls = useSelector((s: RootState) => s.videoGeneratorPro.resultUrls);
  const genError = useSelector((s: RootState) => s.videoGeneratorPro.genError);

  const hasActiveJob = !!(activeJob && !resultUrls && !genError) || isLoading;
  const showStepper = isLoading || resultUrls !== null || genError !== null;

  return (
    <div className="min-h-screen p-6 md:p-2" style={{ backgroundColor: COLORS.deepest }}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: COLORS.mint }}>
            Pro Video Generator
          </h1>
          <p className="max-w-2xl mx-auto" style={{ color: COLORS.sage }}>
            Upload foto produk, masukkan detail produk, dan biarkan AI menghasilkan video berkualitas tinggi secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <ProVideoForm onSubmit={submitVideoJob} hasActiveJob={hasActiveJob} />

          {/* Right: Result / Progress */}
          <div className="lg:col-span-2 space-y-4">

            {/* Empty state */}
            {!isLoading && !resultUrls && !genError && !generatedPrompt && (
              <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl" style={{ borderColor: COLORS.forest, backgroundColor: COLORS.dark, color: COLORS.medium }}>
                {isCheckingActiveJob ? (
                  <>
                    <Loader2 className="w-10 h-10 mb-4 animate-spin opacity-40" />
                    <p>Mengecek status job...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>Hasil video akan muncul di sini</p>
                  </>
                )}
              </div>
            )}

            <ProgressStepper
              show={showStepper}
              displayProgress={displayProgress}
              lastPositiveProgress={lastPositiveProgressRef.current}
            />

            <GenerationStatus
              isLoading={isLoading}
              progressMsg={progressMsg}
              displayProgress={displayProgress}
              genError={genError}
              onReset={cleanupAndReset}
            />

            <PromptPreview generatedPrompt={generatedPrompt} />

            {/* Result */}
            {!isLoading && resultUrls && (
              <>
                <VideoResultCard urls={resultUrls} />
                <div className="flex justify-end">
                  <Button onClick={cleanupAndReset} style={{ backgroundColor: COLORS.sage, color: COLORS.deepest }}>
                    Buat Lagi
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
