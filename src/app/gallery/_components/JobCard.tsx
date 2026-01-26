import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PlayCircle, Layers } from "lucide-react";

interface JobCardProps {
  // We accept the full job object to make it easier to render
  job: {
    id: string;
    jobId: string;
    productName: string;
    thumbnailUrl: string | null;
    videoCount: number; // mapped from targetCount
    voiceGender: string;
    createdAt: string;
  };
  onClick: (jobId: string) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
      onClick={() => onClick(job.jobId)}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video w-full bg-muted">
        {job.thumbnailUrl ? (
          <img 
            src={job.thumbnailUrl} 
            alt={job.productName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/50">
            <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Video Count Badge */}
        <Badge className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm hover:bg-black/80">
          <Layers className="mr-1 h-3 w-3" />
          {job.videoCount} Videos
        </Badge>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        <h3 className="font-semibold leading-none tracking-tight truncate text-base" title={job.productName}>
          {job.productName}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {job.jobId}
        </p>
      </CardContent>

      {/* Footer Section */}
      <CardFooter className="px-4 pb-4 pt-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </span>
        <Badge variant="secondary" className="capitalize text-[10px] h-5 px-2">
          {job.voiceGender}
        </Badge>
      </CardFooter>
    </Card>
  );
}