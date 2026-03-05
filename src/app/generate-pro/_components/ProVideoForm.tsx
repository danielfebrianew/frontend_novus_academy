'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import {
  setProProductTitle, setProProductDescription, setProImagePreview,
  setProFaceCharacter, setProCustomFaceCharacter,
} from '@/store/videoGeneratorProSlice';
import { FACE_CHARACTER_OPTIONS, COLORS } from '../_utils/constants';
import { VideoFormData } from '../_types';
import { Badge } from '@/components/ui/badge';

interface ProVideoFormProps {
  onSubmit: (data: VideoFormData) => Promise<void>;
  hasActiveJob: boolean;
}

export function ProVideoForm({ onSubmit, hasActiveJob }: ProVideoFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const productTitle = useSelector((s: RootState) => s.videoGeneratorPro.productTitle);
  const productDescription = useSelector((s: RootState) => s.videoGeneratorPro.productDescription);
  const imagePreview = useSelector((s: RootState) => s.videoGeneratorPro.imagePreview);
  const faceCharacter = useSelector((s: RootState) => s.videoGeneratorPro.faceCharacter);
  const customFaceCharacter = useSelector((s: RootState) => s.videoGeneratorPro.customFaceCharacter);

  const credits = useSelector((s: RootState) => s.auth.user?.credits || 0);
  const REQUIRED_CREDITS = 20;
  const hasEnoughCredits = credits >= REQUIRED_CREDITS;

  // Restore persisted form fields on mount
  useEffect(() => {
    const saved = localStorage.getItem('novus_pro_form');
    if (saved) {
      const { productTitle: t, productDescription: d, faceCharacter: f, customFaceCharacter: cf } = JSON.parse(saved);
      if (t) dispatch(setProProductTitle(t));
      if (d) dispatch(setProProductDescription(d));
      if (f) dispatch(setProFaceCharacter(f));
      if (cf) dispatch(setProCustomFaceCharacter(cf));
    }
  }, []);

  // Persist form fields to localStorage on change
  useEffect(() => {
    localStorage.setItem('novus_pro_form', JSON.stringify({ productTitle, productDescription, faceCharacter, customFaceCharacter }));
  }, [productTitle, productDescription, faceCharacter, customFaceCharacter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar (Max 5MB)');
      return;
    }
    setImageFile(file);
    dispatch(setProImagePreview(URL.createObjectURL(file)));
  };

  const removeFile = () => {
    setImageFile(null);
    dispatch(setProImagePreview(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveJob) {
      toast.error('Masih ada video yang sedang diproses. Tunggu sampai selesai.', { position: 'top-center' });
      return;
    }
    if (!imageFile || !productTitle.trim() || !productDescription.trim()) {
      toast.error('Semua field wajib diisi', { position: 'top-center' });
      return;
    }
    await onSubmit({ imageFile, productTitle, productDescription, faceCharacter, customFaceCharacter });
  };

  return (
    <Card className="lg:col-span-1 h-fit shadow-lg" style={{ backgroundColor: COLORS.dark, borderColor: COLORS.forest }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: COLORS.mint }}>
          <Sparkles className="w-5 h-5" style={{ color: COLORS.sage }} />
          Konfigurasi
        </CardTitle>
        <CardDescription style={{ color: COLORS.sage }}>Upload foto dan masukkan detail produk.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasActiveJob && (
          <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: COLORS.forest, borderColor: COLORS.medium, border: '1px solid', color: COLORS.mint }}>
            <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
            <span>Video sedang diproses. Kamu tidak bisa membuat video baru sampai proses selesai.</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-1.5">
            <Label style={{ color: COLORS.mint }}>
              Foto Produk <span style={{ color: '#f87171' }}>*</span>
            </Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                id="imageUpload"
                onChange={handleFileChange}
                disabled={hasActiveJob}
              />
              <Label
                htmlFor="imageUpload"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${hasActiveJob ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  borderColor: imagePreview ? COLORS.sage : COLORS.medium,
                  backgroundColor: imagePreview ? COLORS.forest : COLORS.deepest,
                }}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg opacity-80" />
                    {!hasActiveJob && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(); }}
                        className="absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                        style={{ backgroundColor: '#ef4444', color: COLORS.white }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <Upload className="w-8 h-8 mb-2" style={{ color: COLORS.medium }} />
                    <p className="text-sm" style={{ color: COLORS.sage }}>Klik untuk upload foto produk</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.medium }}>PNG, JPG, WEBP (Max 5MB)</p>
                  </div>
                )}
              </Label>
            </div>
            <p className="text-xs" style={{ color: COLORS.medium }}>
              Foto ini akan dijadikan referensi visual (first frame) oleh AI Novus.
            </p>
          </div>

          {/* Product Title */}
          <div className="space-y-1.5">
            <Label htmlFor="productTitle" style={{ color: COLORS.mint }}>
              Nama Produk <span style={{ color: '#f87171' }}>*</span>
            </Label>
            <Input
              id="productTitle"
              placeholder="Contoh: Sandal Wanita Hak Tahu 3cm"
              value={productTitle}
              onChange={(e) => dispatch(setProProductTitle(e.target.value))}
              disabled={hasActiveJob}
              required
              style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}
              className="placeholder:opacity-40"
            />
          </div>

          {/* Product Description */}
          <div className="space-y-1.5">
            <Label htmlFor="productDescription" style={{ color: COLORS.mint }}>
              Deskripsi Produk <span style={{ color: '#f87171' }}>*</span>
            </Label>
            <Textarea
              id="productDescription"
              placeholder="Contoh: Empuk, ringan, outsole anti slip, cocok untuk harian"
              className="resize-none placeholder:opacity-40"
              rows={4}
              value={productDescription}
              onChange={(e) => dispatch(setProProductDescription(e.target.value))}
              disabled={hasActiveJob}
              required
              style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}
            />
            <p className="text-xs" style={{ color: COLORS.medium }}>
              Sebutkan fitur dan keunggulan produk secara singkat.
            </p>
          </div>

          {/* Face Character */}
          <div className="space-y-1.5">
            <Label style={{ color: COLORS.mint }}>Karakter Wajah</Label>
            <Select
              value={faceCharacter}
              onValueChange={(val) => {
                dispatch(setProFaceCharacter(val));
                if (val !== 'custom') dispatch(setProCustomFaceCharacter(''));
              }}
              disabled={hasActiveJob}
            >
              <SelectTrigger style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}>
                <SelectValue placeholder="Pilih karakter (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {FACE_CHARACTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {faceCharacter === 'custom' && (
              <Textarea
                placeholder="Contoh: A young Southeast Asian woman with short hair, wearing a denim jacket"
                className="resize-none placeholder:opacity-40 mt-2"
                rows={2}
                value={customFaceCharacter}
                onChange={(e) => dispatch(setProCustomFaceCharacter(e.target.value))}
                disabled={hasActiveJob}
                style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}
              />
            )}
            <p className="text-xs" style={{ color: COLORS.medium }}>
              Opsional. Pilih karakter yang muncul di video, atau tulis sendiri.
            </p>
          </div>

          <div className="flex items-center justify-between pb-2">
            <span className="text-sm" style={{ color: COLORS.sage }}>
              Saldo Credit: <strong style={{ color: COLORS.mint }}>{credits}</strong>
            </span>
            <Badge variant={hasEnoughCredits ? 'outline' : 'destructive'} className={hasEnoughCredits ? 'border-none' : ''} style={hasEnoughCredits ? { backgroundColor: COLORS.forest, color: COLORS.mint } : undefined}>
              Biaya: {REQUIRED_CREDITS} Credit
            </Badge>
          </div>

          {!hasEnoughCredits && (
            <p className="text-xs text-red-500 mb-2">
              Credit kamu tidak cukup untuk generate video ini. Butuh {REQUIRED_CREDITS} credit.
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-semibold transition-opacity hover:opacity-90"
            disabled={hasActiveJob || !hasEnoughCredits}
            style={{ backgroundColor: (!hasActiveJob && hasEnoughCredits) ? COLORS.sage : COLORS.medium, color: COLORS.deepest }}
          >
            {hasActiveJob ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sedang Memproses...</>
            ) : 'Generate Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
