'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import BirthForm, { BirthFormValues } from './BirthForm';
import { Shield, Sparkles } from 'lucide-react';

interface ChartFormProps {
  onSubmit: (v: BirthFormValues) => void;
  initialValues?: BirthFormValues;
  isSubmitting?: boolean;
}

export default function ChartForm({ onSubmit, initialValues, isSubmitting }: ChartFormProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 space-y-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-7 h-7 text-fuchsia-400 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white drop-shadow-lg">
            Generate Your Chart
          </h2>
          <Sparkles className="w-7 h-7 text-fuchsia-400 animate-pulse" />
        </div>
        <p className="max-w-prose font-body text-white/80 text-lg leading-relaxed">
          Enter your birth details below to unlock your personalized astrological reading.
        </p>
        <div className="inline-flex items-center gap-2 text-white/70 bg-slate-800/30 px-4 py-2 rounded-full border border-slate-600/30 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">Your data is never stored, only used to generate your chart.</span>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-2 border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-sm">
        <BirthForm onSubmit={onSubmit} initialValues={initialValues} isSubmitting={isSubmitting} />
      </Card>
    </div>
  );
}

