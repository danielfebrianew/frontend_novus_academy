// =============================================================================
// STEP 2: REVIEW & SETTINGS VIEW (CLEAN LAYOUT)
// =============================================================================

"use client";

import { useDispatch, useSelector } from "react-redux";
import { Settings2, Mic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { setScript, setStep, setTargetCount, setVoiceGender } from "@/store/videoGeneratorSlice";
import { VOICE_OPTIONS } from "../_utils/constants";
import type { VideoGeneratorState, CountLimits } from "../_types";

interface StepReviewProps {
  countLimits: CountLimits;
  onGenerateVideo: () => void;
}

export function StepReview({ countLimits, onGenerateVideo }: StepReviewProps) {
  const dispatch = useDispatch();
  
  const { script, targetCount, voiceGender } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
      
      {/* GRID CONTAINER: Berdampingan (Kiri: Config, Kanan: Script) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* LEFT COLUMN: CONFIGURATION (Tanpa Judul Header) */}
        <Card className="border-blue-200 bg-blue-50/30 shadow-none h-full">
          <CardContent className="space-y-6 pt-6">
            
            {/* Variation Count Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-slate-500" />
                  Jumlah Variasi
                </label>
                <div className="bg-white border border-blue-200 px-3 py-1 rounded-md">
                  <span className="text-lg font-bold text-blue-600">{targetCount}</span>
                  <span className="text-xs text-slate-400 ml-1">videos</span>
                </div>
              </div>

              <input
                type="range"
                min={countLimits.min}
                max={countLimits.max}
                value={targetCount}
                onChange={(e) => dispatch(setTargetCount(Number(e.target.value)))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:bg-slate-300 transition-colors"
              />

              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Min: {countLimits.min}</span>
                <span>Max: {countLimits.max}</span>
              </div>
            </div>

            <div className="border-t border-blue-200/60"></div>

            {/* Voice Gender Select */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mic className="w-4 h-4 text-slate-500" />
                Suara Voiceover
              </label>
              <div className="relative">
                <select
                  value={voiceGender}
                  onChange={(e) => dispatch(setVoiceGender(e.target.value))}
                  className="w-full p-2.5 pl-3 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block appearance-none shadow-sm"
                >
                  {VOICE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: VOICEOVER SCRIPT (Tanpa Judul Header) */}
        <Card className="flex flex-col shadow-sm h-full">
          <CardContent className="p-0 h-full">
            <Textarea
              value={script}
              onChange={(e) => dispatch(setScript(e.target.value))}
              className="h-full min-h-60 w-full resize-none text-base leading-relaxed bg-white focus:bg-slate-50 border-0 rounded-xl p-6 focus-visible:ring-0 transition-colors"
              placeholder="Tulis naskah video di sini..."
            />
          </CardContent>
        </Card>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={() => dispatch(setStep(1))}
          className="flex-1 border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-12"
        >
          Back
        </Button>

        <Button
          onClick={onGenerateVideo}
          className="flex-3 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all h-12 text-base font-semibold"
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          Generate {targetCount} Videos
        </Button>
      </div>
    </div>
  );
}