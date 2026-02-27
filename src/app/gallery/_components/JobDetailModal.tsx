import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useJobDetail } from "../_hooks/useGallery";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Clock, XCircle } from "lucide-react";
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        ) : jobDetail?.status === "processing" ? (
          <>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Video Sedang Diproses</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Video sedang diproses di server. Silahkan tunggu beberapa saat, halaman akan otomatis terupdate saat video sudah siap.
              </p>
            </div>

            {jobDetail?.script && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
                  Voiceover Script
                </h4>
                <p className="text-sm italic leading-relaxed">
                  &quot;{jobDetail.script}&quot;
                </p>
              </div>
            )}
          </>
        ) : jobDetail?.status === "fail" ? (
          <>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pembuatan Video Gagal</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {jobDetail?.failMsg || "Terjadi kesalahan saat memproses video. Silahkan coba lagi."}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Implement Delete All */}}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Batch
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobDetail?.videos?.map((video: any) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
                Voiceover Script
              </h4>
              <p className="text-sm italic leading-relaxed">
                &quot;{jobDetail?.script}&quot;
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Implement Delete All */}}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Batch
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}