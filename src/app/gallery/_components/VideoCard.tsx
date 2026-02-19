import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function VideoCard({ video }: { video: any }) {
  const handleDownload = () => {
    window.open(video.videoUrl, '_blank');
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