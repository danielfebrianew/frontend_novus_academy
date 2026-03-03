'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '../_utils/constants';

interface PromptPreviewProps {
  generatedPrompt: string | null;
}

export function PromptPreview({ generatedPrompt }: PromptPreviewProps) {
  if (!generatedPrompt) return null;

  return (
    <Card style={{ backgroundColor: COLORS.dark, borderColor: COLORS.forest }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.sage }}>
          <Sparkles className="w-4 h-4" />
          Generated Prompt (GPT-4o Vision)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: COLORS.mint }}>
          {generatedPrompt}
        </pre>
      </CardContent>
    </Card>
  );
}
