'use client';

import { Download, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

const COLORS = {
  deepest: 'var(--background)',
  dark: 'var(--card)',
  forest: 'var(--border)',
  medium: 'var(--muted-foreground)',
  sage: 'var(--primary)',
  mint: 'var(--foreground)',
  white: 'var(--primary-foreground)',
} as const;

interface VideoResultCardProps {
  urls: string[];
}

export function VideoResultCard({ urls }: VideoResultCardProps) {

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.sage }} />
        <h3 className="text-lg font-bold" style={{ color: COLORS.mint }}>Video Berhasil Dibuat</h3>
        <Badge style={{ backgroundColor: COLORS.sage, color: '#ffffff', borderColor: COLORS.sage }}>
          {urls.length} {urls.length === 1 ? 'video' : 'videos'}
        </Badge>
      </div>

      {urls.map((url, index) => (
        <Card key={index} className="shadow-sm" style={{ backgroundColor: COLORS.dark, borderColor: COLORS.forest }}>
          <CardContent className="p-4 space-y-3">
            <video
              src={url}
              controls
              autoPlay
              muted
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: '400px' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: COLORS.sage }}>Video {index + 1}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
