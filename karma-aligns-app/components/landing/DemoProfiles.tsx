'use client';

import React from 'react';
import SampleButtons from './SampleButtons';
import { BirthFormValues } from './BirthForm';

interface DemoProfilesProps {
  onSelect: (v: BirthFormValues) => void;
  onNewForm: () => void;
}

export default function DemoProfiles({ onSelect, onNewForm }: DemoProfilesProps) {
  return (
    <div className="mt-10 p-8 bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 rounded-2xl border-2 border-fuchsia-500/20 backdrop-blur-sm shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white/90 mb-2">Don&apos;t have your birth details handy?</h3>
        <p className="text-white/60 text-sm">Try with these famous personalities to explore the platform:</p>
      </div>
      <div className="flex justify-center">
        <SampleButtons onSelect={onSelect} onNewForm={onNewForm} />
      </div>
    </div>
  );
}

