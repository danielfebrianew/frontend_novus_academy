// =============================================================================
// CAPTION BUILDER UTILITIES
// =============================================================================

import type { CaptionComponents } from "../_types";

/**
 * Build sample caption dari caption components
 * @param components - CaptionComponents dari API response
 * @returns string - Formatted sample caption
 */
export function buildSampleCaption(components: CaptionComponents | null | undefined): string {
  if (!components) return '';

  const { hooks, bodies, ctas, hashtags } = components;

  // Ambil item pertama dari setiap array (atau empty string)
  const hook = hooks?.[0] || '';
  const body = bodies?.[0] || '';
  const cta = ctas?.[0] || '';
  const tags = hashtags?.[0]?.join(' ') || '';

  // Gabungkan dengan format yang rapi
  const parts = [hook, body, cta, tags].filter(Boolean);
  
  return parts.join('\n\n');
}

/**
 * Build random caption dari caption components
 * @param components - CaptionComponents dari API response
 * @returns string - Formatted random caption
 */
export function buildRandomCaption(components: CaptionComponents | null | undefined): string {
  if (!components) return '';

  const { hooks, bodies, ctas, hashtags } = components;

  // Helper untuk random pick
  const randomPick = <T>(arr: T[] | undefined): T | undefined => {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const hook = randomPick(hooks) || '';
  const body = randomPick(bodies) || '';
  const cta = randomPick(ctas) || '';
  const tagsArray = randomPick(hashtags);
  const tags = tagsArray?.join(' ') || '';

  const parts = [hook, body, cta, tags].filter(Boolean);
  
  return parts.join('\n\n');
}

/**
 * Get caption character count
 * @param caption - Caption string
 * @returns object dengan total chars dan breakdown
 */
export function getCaptionStats(caption: string): {
  totalChars: number;
  totalWords: number;
  lineCount: number;
} {
  return {
    totalChars: caption.length,
    totalWords: caption.split(/\s+/).filter(Boolean).length,
    lineCount: caption.split('\n').filter(Boolean).length,
  };
}