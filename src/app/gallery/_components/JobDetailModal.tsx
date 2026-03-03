import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useJobDetail } from "../_hooks/useGallery";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Clock, XCircle, RefreshCw } from "lucide-react";
import { VideoCard } from "./VideoCard";
import { useState } from "react";
import apiService from "@/lib/fetch";
import { mutate } from "swr";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

const KIE_API_KEY = process.env.NEXT_PUBLIC_KIE_API_KEY;

export function JobDetailModal({ isOpen, onClose, jobId }: JobDetailModalProps) {
  const { jobDetail, isLoading, mutate: mutateDetail } = useJobDetail(jobId);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!jobDetail?.jobId || isChecking) return;
    setIsChecking(true);
    try {
      // 1. Check Kie AI directly
      const res = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${jobDetail.jobId}`,
        { headers: { Authorization: `Bearer ${KIE_API_KEY}` } }
      );
      const json = await res.json();
      const state = json?.data?.state;

      if (state === "success" || state === "fail") {
        // 2. Trigger backend sync
        try {
          await apiService.get(`/api/v1/generate-pro/status/${jobDetail.jobId}`);
        } catch (syncErr) {
          console.error("Backend sync failed:", syncErr);
        }
      }

      // 3. Revalidate gallery data
      await mutateDetail();
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/v1/gallery/jobs"),
        undefined,
        { revalidate: true }
      );
    } catch {
      // silently fail
    } finally {
      setIsChecking(false);
    }
  };

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
                Video sedang diproses di server. Klik tombol di bawah untuk cek status terbaru.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isChecking ? "Mengecek..." : "Cek Status"}
              </Button>
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
        ) : jobDetail?.status === "failed" || jobDetail?.status === "fail" ? (
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
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Implement Delete All */ }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Batch
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobDetail?.videos?.map((video: any) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  productName={jobDetail.productName}  // dari parent
                  jobId={jobDetail.jobId}              // dari parent
                />
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
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Implement Delete All */ }}>
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