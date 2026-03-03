'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/fetch';
import { toast } from 'sonner';

interface GenerateTokenResponse {
  message: string;
  data: {
    token: string;
    expiresAt: string;
    expiresIn: string;
  };
}

export default function GeneratePage() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await apiService.post<GenerateTokenResponse>('/api/v1/generate-token/generate');
      setToken(res.data.token);
      setExpiresIn(res.data.expiresIn);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-start pt-20 gap-6 overflow-hidden">
      <div className="flex flex-col items-center gap-2">
        <KeyRound className="h-5 w-10 text-purple-500" />
        <h1 className="text-xl font-semibold">Generate Token</h1>
        <p className="text-slate-500 text-sm">Generate token untuk akses Novus Image Generator</p>
      </div>

      <Button
        onClick={generateToken}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Token'
        )}
      </Button>

      {token && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2 w-full rounded-lg border bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <code className="flex-1 text-sm break-all select-all">{token}</code>
              <button onClick={copyToken} className="shrink-0 text-slate-500 hover:text-slate-700">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {expiresIn && (
              <p className="text-xs text-slate-500 text-center">Berlaku selama {expiresIn}</p>
            )}
          </div>

          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <a
              href="https://gemini.google.com/share/02a85f2eff2c"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buka di Tab Baru
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
