'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { COLORS } from '../_utils/constants';

interface GenerationStatusProps {
  isLoading: boolean;
  progressMsg: string;
  displayProgress: number | null;
  genError: string | null;
  onReset: () => void;
}

export function GenerationStatus({ isLoading, progressMsg, displayProgress, genError, onReset }: GenerationStatusProps) {
  return (
    <>
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl shadow-sm p-8 space-y-6" style={{ backgroundColor: COLORS.dark, border: `1px solid ${COLORS.forest}` }}>
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: COLORS.forest }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.sage }} />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: COLORS.sage }} />
            </div>
            <p className="font-medium text-center" style={{ color: COLORS.mint }}>
              {progressMsg || 'Menghubungkan ke AI...'}
            </p>
          </div>

          <div className="w-full max-w-md space-y-2">
            <Progress value={displayProgress ?? 0} className="h-2" />
            <div className="flex items-center justify-between text-xs" style={{ color: COLORS.medium }}>
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.sage }} />
                <span>Processing...</span>
              </div>
              <span style={{ color: COLORS.sage }}>{displayProgress ?? 0}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: COLORS.forest, border: `1px solid ${COLORS.medium}`, color: COLORS.mint }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.sage }} />
            <span>Jangan meninggalkan halaman ini! Video sedang diproses.</span>
          </div>
        </div>
      )}

      {!isLoading && genError && (
        <div className="min-h-[200px] flex flex-col items-center justify-center rounded-xl p-8 space-y-3 animate-in fade-in duration-500" style={{ backgroundColor: '#1a0808', border: '1px solid #7f1d1d' }}>
          <p className="font-semibold" style={{ color: '#fca5a5' }}>Generate Video Gagal</p>
          <p className="text-sm text-center" style={{ color: '#f87171' }}>{genError}</p>
          <Button size="sm" onClick={onReset} style={{ backgroundColor: COLORS.sage, color: COLORS.deepest }}>
            Buat Lagi
          </Button>
        </div>
      )}
    </>
  );
}
