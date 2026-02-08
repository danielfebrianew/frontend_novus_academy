// src/app/gallery/page.tsx

"use client";

import { useState } from "react";
import { useGallery } from "./_hooks/useGallery";
import { JobCard } from "./_components/JobCard";
import { JobDetailModal } from "./_components/JobDetailModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Layers, AlertCircle } from "lucide-react";

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { gallery, isLoading, isError } = useGallery(page);

  const jobs = gallery?.jobs ?? [];

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () =>
    setPage((p) => Math.min(gallery?.meta.totalPages ?? p, p + 1));

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Video Gallery</h1>
        <p className="text-muted-foreground">
          Browse, manage, and download your AI-generated video campaigns.
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-destructive">
                Failed to load gallery
              </h3>
              <p className="text-sm text-destructive/80">
                There was a problem connecting to the server.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-xl text-center space-y-4">
            <div className="p-6 rounded-full bg-muted">
              <Layers className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No videos found</h3>
              <p className="text-muted-foreground max-w-sm mt-1 mx-auto">
                You haven&apos;t generated any videos yet. Start a new campaign
                to see your results here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={(jobId) => setSelectedJobId(jobId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && gallery && jobs.length > 0 && (
        <div className="flex items-center justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Page {gallery.meta.page} of {gallery.meta.totalPages} &bull; Total{" "}
            {gallery.meta.total} campaigns
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= gallery.meta.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <JobDetailModal
        isOpen={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        jobId={selectedJobId}
      />
    </div>
  );
}