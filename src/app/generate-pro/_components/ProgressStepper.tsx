'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { STEPS, COLORS, stepIconStyle, stepLabelStyle, connectorStyle, StepStatus } from '../_utils/constants';

interface ProgressStepperProps {
  show: boolean;
  displayProgress: number | null;
  lastPositiveProgress: number;
}

export function ProgressStepper({ show, displayProgress, lastPositiveProgress }: ProgressStepperProps) {
  if (!show) return null;

  const getStepStatus = (threshold: number, index: number): StepStatus => {
    const p = displayProgress ?? 0;
    const isFailed = p === -1;
    const effectiveProgress = isFailed ? lastPositiveProgress : p;

    if (isFailed) {
      if (effectiveProgress >= threshold) return 'completed';
      const prevThreshold = index > 0 ? STEPS[index - 1].threshold : 0;
      if (effectiveProgress >= prevThreshold && effectiveProgress < threshold) return 'failed';
      return 'pending';
    }

    if (effectiveProgress >= threshold) return 'completed';
    const prevThreshold = index > 0 ? STEPS[index - 1].threshold : 0;
    if (effectiveProgress >= prevThreshold) return 'active';
    return 'pending';
  };

  return (
    <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: COLORS.dark, border: `1px solid ${COLORS.forest}` }}>
      <div className="flex w-full">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          const status = getStepStatus(step.threshold, index);
          const nextStatus = !isLast ? getStepStatus(STEPS[index + 1].threshold, index + 1) : 'pending';
          const StepIcon = status === 'failed' ? XCircle : status === 'completed' ? CheckCircle2 : step.icon;

          return (
            <div key={step.label} className={`flex flex-col items-start ${isLast ? 'flex-none' : 'flex-1'}`}>
              {/* Icon + connector dalam satu row */}
              <div className="flex items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${status === 'active' ? 'animate-pulse' : ''}`}
                  style={stepIconStyle(status)}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 rounded transition-all" style={connectorStyle(status, nextStatus)} />
                )}
              </div>
              {/* Label di bawah icon */}
              <span className="text-[10px] font-medium text-center leading-tight mt-1.5 w-10" style={stepLabelStyle(status)}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
