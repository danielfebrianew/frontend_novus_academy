import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function VideoCard({ video, productName, jobId }: {
  video: any,
  productName: string,
  jobId: string
}) {
  const handleDownload = async () => {
    const ext = video.videoUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const safeName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeJobId = jobId.slice(0, 8);
    const filename = `${safeName}_${safeJobId}_var${video.variationNumber}.${ext}`;

    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      // Fallback kalau fetch gagal (misal CORS)
      window.open(video.videoUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden bg-background border-muted">
      <CardContent className="p-0 aspect-video bg-black">
        <video
          src={video.videoUrl}
          controls
          className="w-full h-full"
          preload="metadata"
        />
      </CardContent>
      <CardFooter className="p-3 flex justify-between items-center">
        <span className="text-xs font-medium">Variation #{video.variationNumber}</span>
        <Button size="icon" variant="ghost" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}