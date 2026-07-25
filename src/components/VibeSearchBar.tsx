import React, { useState, useRef } from 'react';
import { Search, Mic, Image, X, Sparkles, Filter, SlidersHorizontal, Trash2, Check, RefreshCw, Radio } from 'lucide-react';
import { FilterState, VibeSearchResponse } from '../types';

interface VibeSearchBarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  onExecuteVibeSearch: (customPayload?: any) => Promise<void>;
  vibeResult: VibeSearchResponse | null;
  isSearching: boolean;
  onResetFilters: () => void;
}

const PRESET_VIBES = [
  { label: '🧱 Exposed Brick Loft', value: 'exposed brick loft high ceilings pre-war' },
  { label: '🎷 Speakeasy LES Vibe', value: 'busy nightlife speakeasy exposed brick' },
  { label: '🚇 L Train Hipster Hub', value: 'L train industrial nightlife rooftop' },
  { label: '🌳 Quiet Astoria Oasis', value: 'quiet oasis park views greek food elevator' },
  { label: '🏙️ Skyline Doorman Luxury', value: 'luxury doorman skyline views waterfront' },
  { label: '🎨 Bushwick Art Terrace', value: 'artistic terrace L train creative hub' },
];

export const VibeSearchBar: React.FC<VibeSearchBarProps> = ({
  filterState,
  setFilterState,
  onExecuteVibeSearch,
  vibeResult,
  isSearching,
  onResetFilters,
}) => {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Preset Vibe click
  const handleSelectPreset = (vibeText: string) => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: vibeText,
      selectedVibe: vibeText,
    }));
    onExecuteVibeSearch({ query: vibeText });
  };

  // Audio Recording Toggle
  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingAudio(false);
      clearInterval(timerIntervalRef.current);
    } else {
      // Start audio recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setFilterState((prev) => ({ ...prev, audioRecorded: true }));
            await onExecuteVibeSearch({ audioData: base64Audio });
          };
          // Stop mic tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingAudio(true);
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((sec) => sec + 1);
        }, 1000);
      } catch (err) {
        console.error('Mic access error or denied:', err);
        // Fallback simulation for browser environment without mic permission
        setIsRecordingAudio(true);
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((s) => {
            if (s >= 3) {
              clearInterval(timerIntervalRef.current);
              setIsRecordingAudio(false);
              const simulatedQuery = 'Looking for a sunlit 1-bed near the L train with exposed brick and under $4000';
              setFilterState((prev) => ({
                ...prev,
                searchQuery: simulatedQuery,
                audioRecorded: true,
              }));
              onExecuteVibeSearch({ query: simulatedQuery });
              return 0;
            }
            return s + 1;
          });
        }, 1000);
      }
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setFilterState((prev) => ({ ...prev, imagePreview: base64Image }));
        onExecuteVibeSearch({ imageData: base64Image });
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop Image Handler
  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setFilterState((prev) => ({ ...prev, imagePreview: base64Image }));
        onExecuteVibeSearch({ imageData: base64Image });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      {/* Search Container Panel */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropImage}
        className="relative bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:border-emerald-500/30"
      >
        {/* Subtle glowing ambient pulse */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-900/10 via-emerald-900/10 to-teal-900/10 rounded-3xl blur-xl opacity-30 -z-10" />

        {/* Search Header Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Text Input Field with Icon */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>

            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') onExecuteVibeSearch();
              }}
              placeholder="Vibe search: 'Pre-war with L-train access and exposed brick'..."
              className="w-full pl-11 pr-24 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-sans backdrop-blur-xl"
            />

            {/* Clear Query button */}
            {filterState.searchQuery && (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute inset-y-0 right-14 pr-2 flex items-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Hidden File Input for Image Search */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Multimodal Action Buttons inside Input */}
            <div className="absolute right-2 top-1.5 flex items-center gap-1 border-l border-white/10 pl-2">
              {/* Mic / Audio Record Button */}
              <button
                type="button"
                onClick={toggleAudioRecording}
                title={isRecordingAudio ? 'Stop Recording Voice Vibe' : 'Voice Search Vibe'}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  isRecordingAudio
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Upload Image Vibe Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Match Apartment Photo Aesthetic"
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <Image className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`px-4 py-3 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                showFiltersModal || filterState.borough !== 'all' || filterState.maxPrice < 10000
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Filters</span>
              {(filterState.borough !== 'all' || filterState.maxPrice < 10000) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Main AI Vibe Search Execute Button */}
            <button
              onClick={() => onExecuteVibeSearch()}
              disabled={isSearching}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black font-mono tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>VIBE SEARCH</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audio Recording Live State Banner */}
        {isRecordingAudio && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-mono font-bold">
                LISTENING TO YOUR VIBE PROMPT... ({recordingSeconds}s)
              </span>
              <span className="text-neutral-400 text-[11px] hidden md:inline">
                Speak your desired borough, features, and price budget clearly.
              </span>
            </div>
            <button
              onClick={toggleAudioRecording}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
            >
              Finish & Search
            </button>
          </div>
        )}

        {/* Image Preview Thumbnail Badge */}
        {filterState.imagePreview && (
          <div className="mt-3 p-2.5 rounded-2xl bg-neutral-900 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-3">
              <img
                src={filterState.imagePreview}
                alt="Vibe reference"
                className="w-10 h-10 object-cover rounded-xl border border-amber-500/50"
              />
              <div>
                <p className="font-mono font-bold text-amber-300">Aesthetic Reference Image Attached</p>
                <p className="text-[11px] text-neutral-400">Gemini 3.6 Flash will extract architectural & interior vibes from photo.</p>
              </div>
            </div>
            <button
              onClick={() => setFilterState((prev) => ({ ...prev, imagePreview: null }))}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preset Vibe Chips Row */}
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Presets:
          </span>
          {PRESET_VIBES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleSelectPreset(preset.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium font-sans whitespace-nowrap transition-all border ${
                filterState.selectedVibe === preset.value
                  ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Filter Drawer Expansion */}
        {showFiltersModal && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            {/* Borough Selection */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                Borough Focus
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-900 p-1 rounded-xl border border-white/10 text-xs">
                {['all', 'Manhattan', 'Brooklyn', 'Queens'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setFilterState((prev) => ({ ...prev, borough: b }))}
                    className={`py-1.5 rounded-lg font-medium capitalize transition-all ${
                      filterState.borough.toLowerCase() === b.toLowerCase()
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {b === 'all' ? 'All' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Monthly Rent Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
                <span className="uppercase">Max Rent Budget</span>
                <span className="text-emerald-400 font-bold">${filterState.maxPrice}/mo</span>
              </div>
              <input
                type="range"
                min="2000"
                max="8000"
                step="250"
                value={filterState.maxPrice}
                onChange={(e) =>
                  setFilterState((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Reset Filters CTA */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => onExecuteVibeSearch()}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all"
              >
                Apply Filters
              </button>
              <button
                onClick={onResetFilters}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs flex items-center justify-center"
                title="Reset Filters"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Vibe Summary Result Card Banner */}
      {vibeResult && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-neutral-900/90 to-purple-950/80 border border-blue-500/30 text-neutral-200 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                  AI Vibe Summary Intel
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  {vibeResult.aiConfidence}
                </span>
              </div>
              <p className="text-sm font-sans text-neutral-100 italic leading-relaxed">
                "{vibeResult.vibeSummary}"
              </p>
            </div>
          </div>

          {/* Keywords extracted pills */}
          {vibeResult.extractedKeywords && vibeResult.extractedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {vibeResult.extractedKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-white/10 text-[11px] font-mono text-neutral-300"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
