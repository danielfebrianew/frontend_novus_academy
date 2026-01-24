"use client"

import { useState, useEffect } from "react"
import { Upload, FileVideo, FileAudio, X, Loader2, CheckCircle2, Film, FolderOutput } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { setOutputDirectory } from "@/store/videoMixerSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ✅ Get API URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export default function VideoMixerPage() {
  const [isMounted, setIsMounted] = useState(false)
  const dispatch = useDispatch()

  const savedOutputPath = useSelector((state: RootState) => state.videoMixer?.outputDirectory || "")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [loading, setLoading] = useState(false)
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const [variations, setVariations] = useState<number>(1)
  const [generatedPaths, setGeneratedPaths] = useState<string[]>([])

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

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setOutputDirectory(e.target.value))
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
    if (!savedOutputPath || savedOutputPath.trim() === "") {
      toast.error("Mohon isi lokasi folder penyimpanan (Output Path)!")
      return
    }

    setLoading(true)
    setGeneratedPaths([]) // Reset hasil sebelumnya
    const loadingToast = toast.loading(`Sedang memproses stitching ${variations} variasi...`)

    try {
      // ✅ Build FormData
      const formData = new FormData()
      formData.append("variations", variations.toString())
      formData.append("outputDir", savedOutputPath)

      videoFiles.forEach((file) => {
        formData.append("clips", file)
      })
      
      formData.append("audio", audioFile)

      // ✅ Fetch API Call (Native fetch, no axios)
      const response = await fetch(`${API_BASE_URL}/api/v1/video-mixer`, {
        method: 'POST',
        credentials: 'include', // Include cookies for auth
        body: formData,
        // ✅ JANGAN set Content-Type untuk FormData - browser will auto-set with boundary
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

      // ✅ Parse response
      const data = await response.json()

      // Handle Success
      if (data.success || data.data?.files) {
        toast.dismiss(loadingToast)
        toast.success("Video berhasil digabungkan!", { duration: 4000 })
        
        // ✅ Handle different response structures
        const files = data.files || data.data?.files || []
        setGeneratedPaths(files)
      } else {
        throw new Error("Response tidak sesuai format yang diharapkan")
      }

    } catch (error: any) {
      console.error(error)
      toast.dismiss(loadingToast)
      
      // ✅ Error handling untuk fetch API
      let errorMessage = "Terjadi kesalahan koneksi ke server."
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Specific error messages
        if (error.message.includes("400")) {
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
      <Toaster position="top-center" />
      
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Film className="w-6 h-6 text-blue-600"/>
            Video Mixer
          </CardTitle>
          <CardDescription>
            Upload klip video & audio. Tentukan folder penyimpanan lokal.
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

          {/* --- INPUT OUTPUT PATH --- */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <FolderOutput className="w-5 h-5 text-slate-600" />
              <Label className="font-semibold text-slate-700">
                4. Lokasi Penyimpanan (Wajib)
              </Label>
            </div>
            <p className="text-xs text-slate-500">
              Copy-paste path folder laptop tempat file akan disimpan. <br/>
              Contoh Windows: <code className="bg-slate-200 px-1 rounded">D:\MyProjects\Videos\Output</code><br/>
              Contoh Mac/Linux: <code className="bg-slate-200 px-1 rounded">/Users/budi/Desktop/Result</code>
            </p>
            <Input 
              type="text"
              placeholder="Paste absolute path folder disini..."
              value={savedOutputPath}
              onChange={handlePathChange}
              disabled={loading}
              className="bg-white"
            />
          </div>

          {/* --- SUBMIT BUTTON --- */}
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4" 
            size="lg" 
            onClick={handleSubmit} 
            disabled={loading || videoFiles.length < 2 || !audioFile || !savedOutputPath}
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
          {generatedPaths.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="text-green-600 h-5 w-5"/>
                <h3 className="font-semibold text-green-800">
                  Selesai! File tersimpan di:
                </h3>
              </div>
              <ul className="space-y-1">
                {generatedPaths.map((path, i) => (
                  <li 
                    key={i} 
                    className="text-xs font-mono bg-white p-2 rounded border border-green-100 text-slate-600 break-all"
                  >
                    {path}
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