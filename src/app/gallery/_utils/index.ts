// src/app/gallery/_utils/index.ts

/**
 * Format tanggal jadi readable string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}