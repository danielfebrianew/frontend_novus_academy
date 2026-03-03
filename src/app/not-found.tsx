import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Big 404 */}
        <p className="text-[120px] font-extrabold leading-none text-primary opacity-15 select-none">
          404
        </p>

        <div className="-mt-4 space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Halaman tidak ditemukan</h1>
          <p className="text-muted-foreground text-sm">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
