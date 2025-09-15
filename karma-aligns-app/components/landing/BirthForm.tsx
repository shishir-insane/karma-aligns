'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Calendar, HelpCircle, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

const s = (v: unknown) => (v == null ? '' : String(v));

export type BirthFormValues = {
  name?: string;
  date: string;
  time: string;
  tz: string;
  location: string;
  lat?: string;
  lon?: string;
};

interface ValidationErrors {
  date?: string;
  time?: string;
  tz?: string;
  lat?: string;
  lon?: string;
}

export default function BirthForm({ 
  onSubmit, 
  initialValues,
  isSubmitting = false
}: { 
  onSubmit: (v: BirthFormValues) => void; 
  initialValues?: BirthFormValues;
  isSubmitting?: boolean;
}) {
  const normalized = useMemo<BirthFormValues>(() => ({
    name:     s(initialValues?.name),
    date:     s(initialValues?.date ?? initialValues?.dob),
    time:     s(initialValues?.time ?? initialValues?.tob),
    tz:       s(initialValues?.tz),
    location: s(initialValues?.location),
    lat:      s(initialValues?.lat),
    lon:      s(initialValues?.lon),
  }), [initialValues]);

  const [v, setV] = useState<BirthFormValues>(normalized);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Use useEffect to handle changes to initialValues prop
  useEffect(() => {
    setV(normalized);
  }, [normalized]);

  // Real-time validation
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    
    if (touched.date && !v.date) {
      newErrors.date = 'Birth date is required';
    }
    
    if (touched.time && !v.time) {
      newErrors.time = 'Birth time is required';
    }
    
    if (touched.tz && !v.tz) {
      newErrors.tz = 'Time zone is required';
    } else if (touched.tz && v.tz && !/^[+-]\d{2}:\d{2}$/.test(v.tz)) {
      newErrors.tz = 'Format: ±HH:MM (e.g., +05:30)';
    }
    
    if (touched.lat && !v.lat) {
      newErrors.lat = 'Latitude is required';
    } else if (touched.lat && v.lat && (isNaN(Number(v.lat)) || Number(v.lat) < -90 || Number(v.lat) > 90)) {
      newErrors.lat = 'Must be between -90 and 90';
    }
    
    if (touched.lon && !v.lon) {
      newErrors.lon = 'Longitude is required';
    } else if (touched.lon && v.lon && (isNaN(Number(v.lon)) || Number(v.lon) < -180 || Number(v.lon) > 180)) {
      newErrors.lon = 'Must be between -180 and 180';
    }
    
    setErrors(newErrors);
  }, [v, touched]);

  const disabled = !v.date || !v.time || !v.tz || !v.lat || !v.lon || Object.keys(errors).length > 0;

  const set = <K extends keyof BirthFormValues>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [key]: e.target.value ?? '' }));

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setV(prev => ({
          ...prev,
          lat: latitude.toFixed(4),
          lon: longitude.toFixed(4)
        }));
        setIsDetectingLocation(false);
        
        // Estimate timezone (basic approximation)
        const offset = -new Date().getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        const tz = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setV(prev => ({ ...prev, tz }));
      },
      (error) => {
        console.error('Error detecting location:', error);
        setIsDetectingLocation(false);
        alert('Unable to detect location. Please enter manually.');
      },
      { timeout: 10000 }
    );
  }

  const commonInputClasses = (fieldName: string) => `
    w-full rounded-xl border-2 transition-all duration-200
    bg-slate-800/60 backdrop-blur-sm px-4 py-3 text-white
    placeholder:text-slate-400 focus:outline-none focus:ring-2
    ${errors[fieldName as keyof ValidationErrors] 
      ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20' 
      : 'border-slate-600/40 focus:border-fuchsia-400 focus:ring-fuchsia-400/20 hover:border-slate-500/60'
    }
  `;

  return (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="space-y-6 p-6"
      aria-describedby="form-help"
    >
      {/* Basic Information */}
      <div className="space-y-4" suppressHydrationWarning>
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-fuchsia-400" />
          Basic Information
        </h3>

        {/* Name - Optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="name">
            Full name (optional)
          </label>
          <input 
            id="name" 
            value={v.name || ''} 
            onChange={e => set('name', e.target.value)}
            className={commonInputClasses('name')}
            placeholder="Your name"
          />
        </div>

        {/* Date and Time */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="dob">
              Date of birth *
            </label>
            <input 
              id="dob" 
              type="date" 
              value={v.date || ''}  
              onChange={e => set('date', e.target.value)}
              onBlur={() => handleBlur('date')}
              className={commonInputClasses('date')}
            />
            {errors.date && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.date}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="tob">
              Time of birth *
            </label>
            <input 
              id="tob" 
              type="time" 
              value={v.time || ''} 
              onChange={e => set('time', e.target.value)}
              onBlur={() => handleBlur('time')}
              className={commonInputClasses('time')}
            />
            {errors.time && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.time}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-slate-600/30 pt-6" suppressHydrationWarning> 
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/30 hover:bg-slate-600/40 border border-slate-600/30 hover:border-slate-500/50 text-fuchsia-300 hover:text-fuchsia-200 transition-all duration-200 text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
        >
          {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {showAdvanced ? 'Hide' : 'Show'} Location Settings
          </span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-fuchsia-400" />
              <h3 className="text-lg font-semibold text-white/90">Location & Time Zone</h3>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
                  Location and time zone are needed to calculate accurate planetary positions for your birth chart
                </div>
              </div>
            </div>

            {/* Auto-detect button */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="w-full md:w-auto flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/40 rounded-xl text-sm text-white/80 transition-all disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {isDetectingLocation ? 'Detecting...' : 'Auto-detect my location'}
            </button>

            {/* Time Zone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="tz">
                Time zone * 
                <span className="text-xs text-slate-400 ml-2">Format: ±HH:MM</span>
              </label>
              <input 
                id="tz" 
                value={v.tz || ''}   
                onChange={e => set('tz', e.target.value)}
                onBlur={() => handleBlur('tz')}
                className={commonInputClasses('tz')}
                placeholder="+05:30"
              />
              {errors.tz && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.tz}
                </p>
              )}
            </div>

            {/* Latitude and Longitude */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="lat">
                  Latitude *
                  <span className="text-xs text-slate-400 ml-2">-90 to 90</span>
                </label>
                <input 
                  id="lat" 
                  value={v.lat || ''} 
                  onChange={e => set('lat', e.target.value)}
                  onBlur={() => handleBlur('lat')}
                  className={commonInputClasses('lat')}
                  placeholder="26.7606"
                />
                {errors.lat && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    {errors.lat}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="lon">
                  Longitude *
                  <span className="text-xs text-slate-400 ml-2">-180 to 180</span>
                </label>
                <input 
                  id="lon" 
                  value={v.lon || ''}
                  onChange={e => set('lon', e.target.value)}
                  onBlur={() => handleBlur('lon')}
                  className={commonInputClasses('lon')}
                  placeholder="83.3732"
                />
                {errors.lon && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    {errors.lon}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/20">
        <p id="form-help" className="text-xs text-slate-300 flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full mt-1.5 flex-shrink-0"></span>
          Your data is processed securely and only used to generate your personalized birth chart. We don't store your information permanently.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          type="submit" 
          disabled={disabled || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating chart...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate chart
            </>
          )}
        </button>
        
        <button 
          type="button" 
          onClick={() => {
            setV({ name:'', date:'', time:'', tz:'+05:30', lat:'', lon:'' });
            setTouched({});
            setErrors({});
            setShowAdvanced(false);
          }}
          className="px-6 py-3 rounded-2xl border-2 border-slate-600/40 text-sm font-semibold text-slate-300 hover:border-slate-500/60 hover:text-white transition-all duration-200 hover:bg-slate-700/20"
          disabled={isSubmitting}
        >
          Reset
        </button>
      </div>
    </form>
  );
}