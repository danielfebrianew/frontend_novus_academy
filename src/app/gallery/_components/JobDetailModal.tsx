import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { useJobDetail } from "../_hooks/useGallery"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { VideoCard } from "./VideoCard";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export function JobDetailModal({ isOpen, onClose, jobId }: JobDetailModalProps) {
  const { jobDetail, isLoading } = useJobDetail(jobId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isLoading ? "Loading..." : jobDetail?.productName}
          </DialogTitle>
          <DialogDescription>
            {jobId} • {jobDetail?.targetCount} Videos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {jobDetail?.videos?.map((video: any) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
                Voiceover Script
              </h4>
              <p className="text-sm italic leading-relaxed">
                "{jobDetail?.script}"
              </p>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Implement Delete All */}}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Batch
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}