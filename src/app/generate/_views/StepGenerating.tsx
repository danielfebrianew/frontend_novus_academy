// =============================================================================
// STEP 3: GENERATING VIEW (Loading with Progress)
// =============================================================================

"use client";

import { useSelector } from "react-redux";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { VideoGeneratorState } from "../_types";

export function StepGenerating() {
  const { loadingMsg, progressValue, voiceGender, targetCount } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  return (
    <Card className="py-20 animate-in fade-in duration-500 border-none shadow-none bg-transparent">
      <CardContent className="flex flex-col items-center justify-center space-y-8">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
          <div className="relative p-6 bg-white rounded-full shadow-lg border border-blue-100">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-slate-800">Generating Video...</h3>
          <p className="text-slate-500">{loadingMsg || "Processing..."}</p>
          <p className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
            Voice: {voiceGender === "male" ? "Male 👨" : "Female 👩"} | Variations:{" "}
            {targetCount}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2">
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Processing</span>
            <span>{progressValue}%</span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
          <AlertCircle className="w-4" /> Jangan tutup halaman ini.
        </div>
      </CardContent>
    </Card>
  );
}
