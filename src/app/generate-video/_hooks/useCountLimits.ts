// =============================================================================
// USE COUNT LIMITS HOOK
// =============================================================================

import { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTargetCount } from "@/store/videoGeneratorSlice";
import { COUNT_LIMITS_CONFIG, DEFAULT_COUNT_LIMITS } from "../_constants";
import type { CountLimits, VideoGeneratorState } from "../_types";

interface UseCountLimitsReturn {
  countLimits: CountLimits;
  targetCount: number;
  setCount: (value: number) => void;
  isValidCount: boolean;
}

/**
 * Hook untuk mengelola count limits berdasarkan jumlah prompts
 */
export function useCountLimits(): UseCountLimitsReturn {
  const dispatch = useDispatch();
  
  const { prompts, targetCount, step } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  /**
   * Calculate limits berdasarkan prompt count
   */
  const countLimits = useMemo<CountLimits>(() => {
    const promptCount = prompts?.length || 4;
    return COUNT_LIMITS_CONFIG[promptCount] || DEFAULT_COUNT_LIMITS;
  }, [prompts]);

  /**
   * Auto-set default count ketika masuk step 2
   */
  useEffect(() => {
    if (step === 2) {
      dispatch(setTargetCount(countLimits.default));
    }
  }, [step, countLimits.default, dispatch]);

  /**
   * Set count dengan validation
   */
  const setCount = (value: number) => {
    const clampedValue = Math.min(
      Math.max(value, countLimits.min), 
      countLimits.max
    );
    dispatch(setTargetCount(clampedValue));
  };

  /**
   * Check if current count is valid
   */
  const isValidCount = useMemo(() => {
    return targetCount >= countLimits.min && targetCount <= countLimits.max;
  }, [targetCount, countLimits]);

  return {
    countLimits,
    targetCount,
    setCount,
    isValidCount,
  };
}