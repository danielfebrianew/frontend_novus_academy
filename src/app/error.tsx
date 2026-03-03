'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Big 500 */}
        <p className="text-[120px] font-extrabold leading-none text-destructive opacity-15 select-none">
          500
        </p>

        <div className="-mt-4 space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Terjadi kesalahan</h1>
          <p className="text-muted-foreground text-sm">
            Sesuatu yang tidak terduga terjadi di server. Tim kami sudah diberitahu.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
