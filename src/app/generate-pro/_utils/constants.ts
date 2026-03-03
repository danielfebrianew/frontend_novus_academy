import { Upload, Sparkles, Send, Video, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

export const FACE_CHARACTER_OPTIONS = [
  { value: 'sesuai_foto', label: 'Sesuai Foto' },
  { value: 'remaja_wanita', label: 'Remaja Wanita (16-19)' },
  { value: 'remaja_pria', label: 'Remaja Pria (16-19)' },
  { value: 'wanita_casual', label: 'Wanita Casual (20-28)' },
  { value: 'pria_casual', label: 'Pria Casual (20-30)' },
  { value: 'wanita_hijab', label: 'Wanita Hijab Modern' },
  { value: 'pria_professional', label: 'Pria Professional (25-40)' },
  { value: 'wanita_karir', label: 'Wanita Karir (25-35)' },
  { value: 'custom', label: 'Custom (tulis sendiri)' },
] as const;

export const FACE_CHARACTER_VALUE_MAP: Record<string, string> = {
  sesuai_foto: 'a friendly man ( from reference image )',
};

export const COLORS = {
  deepest: 'var(--background)',
  dark: 'var(--card)',
  forest: 'var(--border)',
  medium: 'var(--muted-foreground)',
  sage: 'var(--primary)',
  mint: 'var(--foreground)',
  white: 'var(--primary-foreground)',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

export type Step = { label: string; threshold: number; icon: LucideIcon };

export const STEPS: Step[] = [
  { label: 'Upload Gambar', threshold: 5, icon: Upload },
  { label: 'Generate Prompt', threshold: 15, icon: Sparkles },
  { label: 'Submit ke AI', threshold: 30, icon: Send },
  { label: 'Rendering Video', threshold: 95, icon: Video },
  { label: 'Selesai', threshold: 100, icon: CheckCircle2 },
];

export const stepIconStyle = (status: StepStatus): CSSProperties => {
  if (status === 'completed') return { backgroundColor: COLORS.sage, color: '#ffffff' };
  if (status === 'active') return { backgroundColor: COLORS.forest, color: COLORS.sage };
  if (status === 'failed') return { backgroundColor: '#3b1010', color: '#f87171' };
  return { backgroundColor: COLORS.forest, color: 'color-mix(in oklch, var(--primary) 35%, transparent)' };
};

export const stepLabelStyle = (status: StepStatus): CSSProperties => {
  if (status === 'completed') return { color: COLORS.mint };
  if (status === 'active') return { color: COLORS.sage };
  if (status === 'failed') return { color: '#f87171' };
  return { color: COLORS.medium };
};

export const connectorStyle = (status: StepStatus, nextStatus: StepStatus): CSSProperties => {
  if (status === 'failed' || nextStatus === 'failed') return { backgroundColor: '#7f1d1d' };
  if (nextStatus === 'completed' || nextStatus === 'active') return { backgroundColor: COLORS.sage };
  return { backgroundColor: COLORS.forest };
};
