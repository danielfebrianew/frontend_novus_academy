import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Layers, CalendarClock, Loader2, XCircle } from "lucide-react";

interface JobCardProps {
  job: {
    id: string;
    jobId: string;
    productName: string;
    thumbnailUrl: string | null;
    videoCount: number;
    voiceGender: string | null;
    isPro: boolean;
    status: "processing" | "success" | "fail";
    createdAt: string;
  };
  onClick: (jobId: string) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const formatWIB = (dateString: string) => {
    if (!dateString) return "-";

    let safeString = dateString.replace(" ", "T");

    if (!safeString.endsWith("Z")) {
      safeString += "Z";
    }

    try {
      const date = new Date(safeString);

      if (isNaN(date.getTime())) return dateString;

      return (
        new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }).format(date) + " WIB"
      );
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
      onClick={() => onClick(job.jobId)}
    >
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

        {job.status === "processing" && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="text-white text-sm font-medium">Sedang Diproses</span>
          </div>
        )}

        {job.status === "fail" && (
          <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center gap-2">
            <XCircle className="h-8 w-8 text-red-300" />
            <span className="text-red-200 text-sm font-medium">Gagal</span>
          </div>
        )}

        {job.status === "processing" ? (
          <Badge className="absolute bottom-2 right-2 bg-yellow-500/80 backdrop-blur-sm hover:bg-yellow-500/90 animate-pulse">
            Processing
          </Badge>
        ) : job.status === "fail" ? (
          <Badge className="absolute bottom-2 right-2 bg-red-600/80 backdrop-blur-sm hover:bg-red-600/90">
            Gagal
          </Badge>
        ) : (
          <Badge className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm hover:bg-black/80">
            <Layers className="mr-1 h-3 w-3" />
            {job.videoCount} Videos
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3
          className="font-semibold leading-none tracking-tight truncate text-base"
          title={job.productName}
        >
          {job.productName}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {job.jobId}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex justify-between items-center">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarClock className="mr-1 h-3 w-3" />
          {formatWIB(job.createdAt)}
        </div>
        {job.isPro ? (
          <Badge className="text-[10px] h-5 px-2 bg-primary text-primary-foreground">
            Pro
          </Badge>
        ) : (
          <Badge variant="secondary" className="capitalize text-[10px] h-5 px-2">
            {job.voiceGender}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
