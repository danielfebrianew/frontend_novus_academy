"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { UploadCloud, CheckCircle, Loader2, Play, AlertCircle, Trash2, Copy, Settings2, ArrowDown, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from 'react-hot-toast';
import ImageCropper from "@/components/common/ImageCropper";
import { apiService } from "@/services/api";
import { useDispatch, useSelector } from "react-redux";

import { 
  setCaption, 
  setCropperImgSrc, 
  setCropperOpen, 
  setLoading, 
  setLoadingMsg, 
  setProgressValue, 
  setPrompts, 
  setResults, 
  setScript, 
  setStep, 
  setUploadedImageUrls,
  setProductName,
  setTargetCount,
  setVoiceGender
} from "@/store/videoGeneratorSlice";

export default function VideoGeneratorPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOCAL STATE (Untuk Handle File/Blob) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [readyFiles, setReadyFiles] = useState<File[]>([]);

  // --- REDUX STATE ---
  const {
    step,
    loading,
    loadingMsg,
    progressValue,
    uploadedImageUrls,
    productName,
    script,
    caption,
    prompts,
    results,
    cropperOpen,
    cropperImgSrc,
    targetCount,
    voiceGender
  } = useSelector((state: any) => state.videoGenerator); 

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const countLimits = useMemo(() => {
    const pCount = prompts?.length || 4;
    if (pCount === 4) return { min: 4, max: 20, default: 5 };
    if (pCount === 5) return { min: 5, max: 50, default: 10 };
    if (pCount === 6) return { min: 6, max: 100, default: 15 };
    return { min: 4, max: 20, default: 5 };
  }, [prompts]);

  useEffect(() => {
    if (step === 2) {
        dispatch(setTargetCount(countLimits.default));
    }
  }, [step, countLimits.default, dispatch]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file); 
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        dispatch(setCropperImgSrc(reader.result?.toString() || null));
        dispatch(setCropperOpen(true));
      });
      reader.readAsDataURL(file);
      e.target.value = ""; 
    }
  };

  const blobToFile = (theBlob: Blob, fileName: string): File => {
    const name = fileName || "image.jpg";
    const extension = name.substring(name.lastIndexOf('.'));
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '_');
    const finalName = `${cleanName}_${new Date().getTime()}${extension || '.jpg'}`;
    return new File([theBlob], finalName, {
      lastModified: new Date().getTime(),
      type: theBlob.type
    });
  };

  const onCropFinished = (croppedBlob: Blob) => {
    if (selectedFile) {
      const croppedFile = blobToFile(croppedBlob, selectedFile.name);
      setReadyFiles((prev) => [...prev, croppedFile]);
      toast.success("Foto berhasil dipotong!");
      dispatch(setCropperOpen(false));
      setSelectedFile(null); 
    }
  };

  const removeFile = (index: number) => {
    setReadyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- REVISI UTAMA ADA DI FUNCTION INI ---
  const handleProcessImages = async () => {
    if (readyFiles.length === 0) return toast.error("Belum ada foto yang dipilih!");
    if (!productName.trim()) return toast.error("Nama produk wajib diisi!");

    dispatch(setLoading(true));
    dispatch(setLoadingMsg("Mengupload gambar..."));

    try {
      const urls = await apiService.uploadImages(readyFiles);
      dispatch(setUploadedImageUrls(urls));

      dispatch(setLoadingMsg("Menganalisa gambar & membuat aset..."));

      // Panggil API
      const data = await apiService.analyzeImage({
        imageUrl: urls[0], 
        productName: productName,
        promptCount: urls.length
      });

      // FIX: Langsung destructure dari 'data' (karena apiService sudah unwrap)
      const { voiceover, videoPrompts, captionComponents } = data;

      dispatch(setScript(voiceover));
      dispatch(setPrompts(videoPrompts));

      if (captionComponents) {
        const { hooks, bodies, ctas, hashtags } = captionComponents;
        const randomHook = hooks?.[0] || "";
        const randomBody = bodies?.[0] || "";
        const randomCta = ctas?.[0] || "";
        const randomTags = hashtags?.[0]?.join(' ') || "";
        
        const sampleCaption = `${randomHook}\n\n${randomBody}\n\n${randomCta}\n\n${randomTags}`;
        dispatch(setCaption(sampleCaption));
      }

      toast.success("Analisa Selesai!");
      dispatch(setStep(2));
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : "Gagal memproses gambar";
      toast.error(`Gagal: ${errMsg}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGenerateVideo = async () => {
    if (targetCount < countLimits.min || targetCount > countLimits.max) {
        return toast.error(`Jumlah variasi harus antara ${countLimits.min} - ${countLimits.max}`);
    }

    dispatch(setStep(3));
    dispatch(setLoading(true));
    dispatch(setProgressValue(0));

    try {
      const resultData = await apiService.generateVideo({
        images: uploadedImageUrls,
        prompts: prompts,
        script: script,
        targetCount: Number(targetCount),
        jobId: `JOB_${Date.now()}`,
        voiceGender: voiceGender
      });
      
      dispatch(setResults(resultData.variations));
      dispatch(setStep(4));
      toast.success("Video Selesai!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal Generate Video.");
      dispatch(setStep(2)); 
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="max-w-xl mx-auto mb-10 text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">AI Video Generator</h1>
          <p className="text-slate-500">Upload foto produk, crop 9:16, biarkan AI bekerja.</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 text-left">
          <label className="text-sm font-semibold text-slate-700 ml-1">
            Nama Produk / Brand <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: Sepatu Lari Nike Zoom Air"
            value={productName}
            onChange={(e) => dispatch(setProductName(e.target.value))}
            disabled={loading || step > 1}
            className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <ImageCropper
        isOpen={cropperOpen} 
        imageSrc={cropperImgSrc}
        onClose={() => dispatch(setCropperOpen(false))}
        onCropComplete={onCropFinished}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-dashed border-2 border-slate-300 shadow-none bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="p-4 bg-white shadow-sm rounded-full">
                  {loading ? <Loader2 className="h-8 w-8 text-blue-500 animate-spin" /> : <UploadCloud className="h-8 w-8 text-blue-500" />}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-slate-800">Tambah Foto Produk</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Format: JPG/PNG. Rasio crop otomatis 9:16.
                  </p>
                </div>

                <div className="relative mt-4">
                  <Button variant="outline" className="cursor-pointer border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                    Pilih File Gambar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {readyFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Siap Upload ({readyFiles.length})</h3>
                  <Button
                    size="sm"
                    onClick={handleProcessImages}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Lanjut Proses
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {readyFiles.map((file: File, idx: number) => (
                    <div key={idx} className="relative group aspect-ratio:9/16 bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 w-full bg-linear-to-t from-black/60 to-transparent text-white text-[10px] p-2 text-center pt-4">
                        Img {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REVIEW & SETTINGS */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* LEFT COL: SETTINGS & SCRIPT */}
            <div className="flex flex-col gap-6 h-full">
                
                {/* 1. SETTINGS CARD (Target Output & Voice) */}
                <Card className="border-blue-200 bg-blue-50/30 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                            <Settings2 className="w-5 h-5 text-blue-600" /> 
                            Konfigurasi Video
                        </CardTitle>
                        <CardDescription>
                            Atur jumlah variasi dan karakteristik suara AI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* SLIDER TARGET COUNT */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-700">Jumlah Variasi</label>
                                <div className="bg-white border border-blue-200 px-3 py-1 rounded-md">
                                  <span className="text-lg font-bold text-blue-600">{targetCount}</span>
                                  <span className="text-xs text-slate-400 ml-1">videos</span>
                                </div>
                            </div>
                            
                            <input 
                                type="range" 
                                min={countLimits.min}
                                max={countLimits.max}
                                value={targetCount}
                                onChange={(e) => dispatch(setTargetCount(Number(e.target.value)))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:bg-slate-300 transition-colors"
                            />
                            
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>Min: {countLimits.min}</span>
                                <span>Max: {countLimits.max}</span>
                            </div>
                        </div>

                        <div className="border-t border-blue-200/60"></div>

                        {/* DROPDOWN VOICE GENDER */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Mic className="w-4 h-4 text-slate-500" />
                                Suara Voiceover
                            </label>
                            <div className="relative">
                                <select
                                    value={voiceGender}
                                    onChange={(e) => dispatch(setVoiceGender(e.target.value))}
                                    className="w-full p-2.5 pl-3 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block appearance-none shadow-sm"
                                >
                                    <option value="female">Wanita (Female) - Rekomendasi</option>
                                    <option value="male">Pria (Male)</option>
                                </select>
                                {/* Custom Chevron Icon */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 italic leading-tight">
                                *AI akan memilih variasi tone suara {voiceGender === 'male' ? 'Pria' : 'Wanita'} terbaik secara otomatis.
                            </p>
                        </div>

                    </CardContent>
                </Card>

                {/* 2. SCRIPT EDITOR */}
                <Card className="flex flex-col flex-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Voiceover Script</CardTitle>
                        <CardDescription>Review atau edit naskah yang akan dibacakan AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[200px]">
                        <Textarea
                            value={script}
                            onChange={(e) => dispatch(setScript(e.target.value))}
                            className="h-full min-h-[200px] resize-none text-base leading-relaxed bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Tulis naskah video di sini..."
                        />
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COL: VISUALS & PREVIEW */}
            <Card className="flex flex-col h-full shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Visual Prompts & Caption</CardTitle>
                <CardDescription>Aset visual dan teks yang dibuat AI.</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                
                {/* SECTION: VISUAL PROMPTS */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Video Prompts
                        <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] border border-slate-200">
                            {prompts.length} Scenes
                        </span>
                    </h4>
                    <div className="space-y-2">
                        {prompts.map((p: string, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200 flex gap-3 items-start group hover:border-blue-300 transition-colors">
                            <span className="font-bold text-slate-400 bg-white border border-slate-200 w-6 h-6 flex items-center justify-center rounded text-xs shrink-0 group-hover:text-blue-500 group-hover:border-blue-200">
                                {i + 1}
                            </span>
                            <span className="leading-snug">{p}</span>
                        </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* SECTION: CAPTION */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sample Caption</h4>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => { navigator.clipboard.writeText(caption); toast.success("Caption disalin!"); }}
                        >
                            <Copy className="h-3 w-3 mr-1.5" /> Salin
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200 whitespace-pre-wrap italic leading-relaxed">
                            {caption}
                        </div>
                         {/* Indikator kecil */}
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                        *Caption ini adalah contoh kombinasi komponen. Hasil akhir mungkin bervariasi.
                    </p>
                </div>

              </CardContent>

              {/* FOOTER ACTIONS */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-auto">
                <div className="flex gap-4 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => dispatch(setStep(1))} 
                    className="flex-1 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleGenerateVideo} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" /> 
                    Generate {targetCount} Videos
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <Card className="py-20 animate-in fade-in duration-500 border-none shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
                <div className="relative p-6 bg-white rounded-full shadow-lg border border-blue-100">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Generating Video...</h3>
                <p className="text-slate-500">{loadingMsg}</p>
                {/* Tambahan info visual */}
                <p className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
                    Voice: {voiceGender === 'male' ? 'Male 👨' : 'Female 👩'} | Variations: {targetCount}
                </p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Processing</span>
                  <span>{progressValue}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                <AlertCircle className="w-4 h-4" /> Jangan tutup halaman ini.
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <CheckCircle className="text-green-500" /> Selesai!
                </h2>
                <p className="text-sm text-slate-500">Berhasil membuat {results.length} variasi video.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Buat Baru</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map((url: string, idx: number) => (
                <div key={idx} className="bg-black rounded-lg overflow-hidden aspect-ratio:9/16 shadow-lg group relative">
                  <video src={url} controls className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <a href={url} download target="_blank" rel="noreferrer" className="bg-white/80 p-2 rounded-full hover:bg-white text-black block">
                        <ArrowDown className="w-4 h-4" />
                     </a>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Var #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}