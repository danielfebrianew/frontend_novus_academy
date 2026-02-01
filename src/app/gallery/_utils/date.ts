export function formatToWIB(dateString: string | Date) {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  
  // Menggunakan Intl.DateTimeFormat untuk konversi ke Asia/Jakarta
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short", // Jan, Feb, dst
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Format 24 jam
    timeZone: "Asia/Jakarta", // KUNCI: Paksa ke WIB
  }).format(date);
}