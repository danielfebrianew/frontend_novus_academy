'use client';

import { Download, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface VideoResultCardProps {
  urls: string[];
}

export function VideoResultCard({ urls }: VideoResultCardProps) {
  const handleDownload = (url: string, index: number) => {
    const filename = `pro-video-${index + 1}.mp4`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download dimulai!');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold text-slate-900">Video Berhasil Dibuat</h3>
        <Badge className="bg-green-100 text-green-700 border-green-200">
          {urls.length} {urls.length === 1 ? 'video' : 'videos'}
        </Badge>
      </div>

      {urls.map((url, index) => (
        <Card key={index} className="border-green-200 shadow-sm">
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
              <span className="text-sm text-slate-500">Video {index + 1}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(url, index)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
