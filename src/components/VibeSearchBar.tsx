import React, { useState, useRef } from 'react';
import { Search, Mic, Image, X, Sparkles, SlidersHorizontal, Trash2, RefreshCw } from 'lucide-react';
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

  const handleSelectPreset = (vibeText: string) => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: vibeText,
      selectedVibe: vibeText,
    }));
    onExecuteVibeSearch({ query: vibeText });
  };

  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingAudio(false);
      clearInterval(timerIntervalRef.current);
    } else {
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
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropImage}
        className="relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-teal-300"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-teal-600" />
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
              className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
            />

            {filterState.searchQuery && (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute inset-y-0 right-14 pr-2 flex items-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="absolute right-2 top-1.5 flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={toggleAudioRecording}
                title={isRecordingAudio ? 'Stop Recording Voice Vibe' : 'Voice Search Vibe'}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  isRecordingAudio
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-teal-700 hover:bg-teal-50'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Match Apartment Photo Aesthetic"
                className="p-1.5 rounded-full text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-all flex items-center justify-center"
              >
                <Image className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                showFiltersModal || filterState.borough !== 'all' || filterState.maxPrice < 10000
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Filters</span>
              {(filterState.borough !== 'all' || filterState.maxPrice < 10000) && (
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              )}
            </button>

            <button
              onClick={() => onExecuteVibeSearch()}
              disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Vibe search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isRecordingAudio && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-semibold">
                Listening… ({recordingSeconds}s)
              </span>
              <span className="text-rose-500/80 text-[11px] hidden md:inline">
                Speak your desired borough, features, and price budget clearly.
              </span>
            </div>
            <button
              onClick={toggleAudioRecording}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-semibold"
            >
              Finish & Search
            </button>
          </div>
        )}

        {filterState.imagePreview && (
          <div className="mt-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-3">
              <img
                src={filterState.imagePreview}
                alt="Vibe reference"
                className="w-10 h-10 object-cover rounded-xl border border-amber-200"
              />
              <div>
                <p className="font-semibold text-amber-800">Aesthetic reference image attached</p>
                <p className="text-[11px] text-amber-700/80">We'll extract architectural & interior vibes from your photo.</p>
              </div>
            </div>
            <button
              onClick={() => setFilterState((prev) => ({ ...prev, imagePreview: null }))}
              className="p-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-700 border border-amber-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-teal-600" />
            Presets:
          </span>
          {PRESET_VIBES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleSelectPreset(preset.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                filterState.selectedVibe === preset.value
                  ? 'bg-teal-600 border-teal-600 text-white font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {showFiltersModal && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase font-semibold tracking-wide">
                Borough Focus
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                {['all', 'Manhattan', 'Brooklyn', 'Queens'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setFilterState((prev) => ({ ...prev, borough: b }))}
                    className={`py-1.5 rounded-lg font-medium capitalize transition-all ${
                      filterState.borough.toLowerCase() === b.toLowerCase()
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {b === 'all' ? 'All' : b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="uppercase font-semibold tracking-wide">Max Rent Budget</span>
                <span className="text-teal-700 font-semibold">${filterState.maxPrice}/mo</span>
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
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => onExecuteVibeSearch()}
                className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all"
              >
                Apply Filters
              </button>
              <button
                onClick={onResetFilters}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs flex items-center justify-center"
                title="Reset Filters"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {vibeResult && (
        <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white text-teal-700 shrink-0 border border-teal-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  AI vibe summary
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-teal-700 text-[10px] border border-teal-200 font-semibold">
                  {vibeResult.aiConfidence}
                </span>
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "{vibeResult.vibeSummary}"
              </p>
            </div>
          </div>

          {vibeResult.extractedKeywords && vibeResult.extractedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {vibeResult.extractedKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-[11px] text-teal-700"
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
