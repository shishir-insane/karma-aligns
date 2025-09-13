'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import BirthForm, { BirthFormValues } from './BirthForm';
import { Shield, Sparkles } from 'lucide-react';
import { H2, Body } from '@/components/ui/Type';

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
          <H2>
          Your Cosmic Awakening Starts Here
          </H2>
          <Sparkles className="w-7 h-7 text-fuchsia-400 animate-pulse" />
        </div>
        <Body>
        Enter your birth details to unlock profound insights that will transform how you see yourself, your relationships, and your life's purpose.
        </Body>
        <div className="inline-flex items-center gap-2 text-white/70 bg-slate-800/30 px-4 py-2 rounded-full border border-slate-600/30 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">Your sacred data is protected and never stored. Used once, then permanently deleted.</span>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-2 border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-sm">
        <BirthForm onSubmit={onSubmit} initialValues={initialValues} isSubmitting={isSubmitting} />
      </Card>
    </div>
  );
}

