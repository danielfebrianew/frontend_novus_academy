"use client"

import { useState, useEffect } from "react"
import { Upload, FileVideo, FileAudio, X, Loader2, CheckCircle2, Film, ExternalLink, Package, FileText, User } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authService } from "@/lib/authService"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

function generateJobId(): string {
  return `JOB_${Date.now()}`
}

interface MixerResult {
  jobId: string
  totalVariations: number
  variations: string[]
}

export default function VideoMixerPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [loading, setLoading] = useState(false)
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const [variations, setVariations] = useState<number>(1)
  const [productName, setProductName] = useState("")
  const [script, setScript] = useState("")
  const [voiceGender, setVoiceGender] = useState<string>("male")
  const [result, setResult] = useState<MixerResult | null>(null)

  // ============================================================================
  // HANDLERS - File Selection
  // ============================================================================

  // 1. Handle Video Selection (Min 2, Max 6)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const totalFiles = videoFiles.length + newFiles.length

      if (totalFiles > 6) {
        toast.error("Maksimal hanya boleh 6 video!")
        return
      }

      const validVideos = newFiles.filter(file => file.type.startsWith("video/"))
      if (validVideos.length !== newFiles.length) {
        toast.error("Beberapa file bukan video")
      }

      setVideoFiles((prev) => [...prev, ...validVideos])
    }
  }

  // 2. Remove Video
  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // 3. Handle Audio Selection
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0])
    }
  }

  // ============================================================================
  // SUBMIT - Process Video Mixing
  // ============================================================================
  const handleSubmit = async () => {
    // Validation
    if (videoFiles.length < 2) {
      toast.error("Minimal harus upload 2 video!")
      return
    }
    if (!audioFile) {
      toast.error("Wajib upload 1 file audio!")
      return
    }

    const token = authService.getAccessToken()
    if (!token) {
      toast.error("Silakan login terlebih dahulu!")
      return
    }

    setLoading(true)
    setResult(null)
    const jobId = generateJobId()
    const loadingToast = toast.loading(`Sedang memproses ${variations} variasi...`)

    try {
      const formData = new FormData()
      formData.append("variations", variations.toString())
      formData.append("jobId", jobId)

      if (productName.trim()) {
        formData.append("productName", productName.trim())
      }
      if (script.trim()) {
        formData.append("script", script.trim())
      }
      if (voiceGender) {
        formData.append("voiceGender", voiceGender)
      }

      videoFiles.forEach((file) => {
        formData.append("clips", file)
      })

      formData.append("audio", audioFile)

      const response = await fetch(`${API_BASE_URL}/api/v1/video-mixer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Response wrapped by ResponseInterceptor: { statusCode, message, data: { success, jobId, ... } }
      const result = data.data || data
      if (result.jobId && result.variations) {
        toast.dismiss(loadingToast)
        toast.success("Video berhasil di-mix dan diupload ke S3!", { duration: 4000 })

        setResult({
          jobId: result.jobId,
          totalVariations: result.totalVariations,
          variations: result.variations || [],
        })
      } else {
        throw new Error(data.message || "Response tidak sesuai format yang diharapkan")
      }

    } catch (error: unknown) {
      console.error(error)
      toast.dismiss(loadingToast)

      let errorMessage = "Terjadi kesalahan koneksi ke server."

      if (error instanceof Error) {
        errorMessage = error.message

        if (error.message.includes("401")) {
          errorMessage = "Sesi login sudah habis. Silakan login ulang."
        } else if (error.message.includes("400")) {
          errorMessage = "Data tidak valid. Periksa input Anda."
        } else if (error.message.includes("413")) {
          errorMessage = "File terlalu besar. Kurangi ukuran video."
        } else if (error.message.includes("500")) {
          errorMessage = "Server error saat memproses video."
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet."
        }
      }

      toast.error(`Gagal: ${errorMessage}`, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4">
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Film className="w-6 h-6 text-blue-600"/>
            Video Mixer
          </CardTitle>
          <CardDescription>
            Upload klip video & audio. Hasil video akan diupload ke S3 dan tersimpan di Gallery.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">

          {/* --- INPUT VIDEOS --- */}
          <div className="space-y-2">
            <Label>1. Upload Video Clips (Min 2, Max 6)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer relative group">
              <Input
                type="file"
                multiple
                accept="video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleVideoChange}
                disabled={loading}
              />
              <div className="bg-blue-50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Klik untuk upload video</p>
              <p className="text-xs text-slate-400 mt-1">{videoFiles.length} / 6 file terpilih</p>
            </div>

            {/* List Video */}
            {videoFiles.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mt-4">
                {videoFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-100 rounded-md border text-sm">
                    <div className="flex items-center truncate gap-3">
                      <div className="bg-slate-200 p-1 rounded">
                        <FileVideo className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="truncate max-w-[200px] font-medium text-slate-700">
                        {file.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                      onClick={() => removeVideo(idx)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- INPUT AUDIO --- */}
            <div className="space-y-2">
              <Label>2. Background Audio</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                disabled={loading}
              />
              {audioFile && (
                <div className="flex items-center p-2 bg-green-50 text-green-700 rounded text-sm border border-green-200 mt-1">
                  <FileAudio className="h-4 w-4 mr-2" />
                  <span className="truncate">{audioFile.name}</span>
                </div>
              )}
            </div>

            {/* --- INPUT VARIATIONS --- */}
            <div className="space-y-2">
              <Label>3. Jumlah Variasi</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value) || 1)}
                disabled={loading}
              />
            </div>
          </div>

          {/* --- METADATA FIELDS --- */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm">4. Metadata (Opsional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Package className="h-3 w-3" /> Nama Produk
                </Label>
                <Input
                  type="text"
                  placeholder="Nama produk..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={loading}
                  className="bg-white"
                />
              </div>

              {/* Voice Gender */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <User className="h-3 w-3" /> Voice Gender
                </Label>
                <select
                  value={voiceGender}
                  onChange={(e) => setVoiceGender(e.target.value)}
                  disabled={loading}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Script */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" /> Script
              </Label>
              <Textarea
                placeholder="Tulis script produk disini..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                disabled={loading}
                className="bg-white min-h-[80px]"
              />
            </div>
          </div>

          {/* --- SUBMIT BUTTON --- */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            size="lg"
            onClick={handleSubmit}
            disabled={loading || videoFiles.length < 2 || !audioFile}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sedang Memproses...
              </>
            ) : (
              <>
                <Film className="mr-2 h-4 w-4" />
                Mulai Mixing
              </>
            )}
          </Button>

          {/* --- RESULTS AREA --- */}
          {result && result.variations.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="text-green-600 h-5 w-5"/>
                <h3 className="font-semibold text-green-800">
                  Selesai! {result.totalVariations} variasi berhasil diupload
                </h3>
              </div>
              <p className="text-xs text-green-600 mb-3">Job ID: {result.jobId}</p>
              <ul className="space-y-2">
                {result.variations.map((url, i) => (
                  <li
                    key={i}
                    className="text-xs bg-white p-3 rounded border border-green-100 flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-slate-600 truncate">
                      Variasi {i + 1}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Buka Video
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
