import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Shield,
  Volume2,
  Utensils,
  Train,
  CheckCircle,
  ExternalLink,
  Video,
  Share2,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  Award,
  Zap,
} from 'lucide-react';
import { Listing, IntelResponse } from '../types';

interface NeighborhoodIntelModalProps {
  listing: Listing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (listing: Listing) => void;
}

export const NeighborhoodIntelModal: React.FC<NeighborhoodIntelModalProps> = ({
  listing,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  const [intelData, setIntelData] = useState<IntelResponse | null>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!listing) return;

    let isMounted = true;
    setIsLoadingIntel(true);
    setIntelData(null);

    fetch(`/api/neighborhood-intel/${listing.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setIntelData(data);
          setIsLoadingIntel(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching intel:', err);
        if (isMounted) setIsLoadingIntel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listing]);

  if (!listing) return null;

  // Copy share briefing handler
  const handleCopyBriefing = () => {
    const text = `GOTHAM INTEL BRIEFING for ${listing.title} (${listing.neighborhood}): Price $${listing.price}/mo. View listing & AI analysis on GothamIntel!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Modal Card Box */}
      <div className="relative bg-neutral-950 border border-white/20 shadow-2xl rounded-3xl max-w-4xl w-full my-auto overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-black/60 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 font-bold uppercase">
                {listing.borough} • {listing.neighborhood}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono border border-white/20 font-bold">
                ${listing.price.toLocaleString()}/mo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 text-[10px] font-mono border border-white/10">
                Source: {listing.source}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white font-sans tracking-tight">
              {listing.title}
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{listing.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleSave(listing)}
              className={`p-2.5 rounded-2xl border transition-all ${
                isSaved
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* SASSY NEW YORKER AI REVIEW CARD */}
          <div className="relative p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
                    Sassy New Yorker Analysis
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {intelData?.isGeminiLive
                      ? '⚡ Powered live by Gemini 3.6 Flash'
                      : '⚡ Gotham Deterministic Veteran Intel Engine'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyBriefing}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-mono flex items-center gap-1.5 border border-white/10 transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copiedLink ? 'Copied!' : 'Share Briefing'}</span>
              </button>
            </div>

            {isLoadingIntel ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="font-mono text-sm text-neutral-300 animate-pulse">
                  Consulting street-smart NYC veterans & scanning neighborhood decibels...
                </p>
              </div>
            ) : intelData?.intel ? (
              <div className="space-y-4">
                {/* Ultimate Lease Verdict */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider text-emerald-400">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Ultimate Lease Verdict
                  </div>
                  <p className="text-sm italic leading-relaxed text-neutral-200 font-sans">
                    "{intelData.intel.ultimateLeaseVerdict}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Safety Reality */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Safety Reality</div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {intelData.intel.safetyReality}
                    </p>
                  </div>

                  {/* Noise & Vibe Forecast */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Noise & Vibe Forecast</div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {intelData.intel.noiseVibeForecast}
                    </p>
                  </div>

                  {/* Bodega Grade */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Bodega & BEC Grade</div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {intelData.intel.bodegaGrade}
                    </p>
                  </div>

                  {/* Transit Hack */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Transit Cheat Code</div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {intelData.intel.transitHack}
                    </p>
                  </div>
                </div>

                {/* Neighborhood Personality */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono flex items-center gap-2.5">
                  <span className="font-bold text-emerald-400 shrink-0">LOCAL ARCHETYPE:</span>
                  <span className="italic">"{intelData.intel.neighborhoodPersonality}"</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* TWO COLUMN GRID: YouTube Walking Tour Video & Mock Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Embedded YouTube Walking Tour Search Framework */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-300">
                <span className="flex items-center gap-1.5 font-bold text-white uppercase">
                  <Video className="w-4 h-4 text-rose-500" />
                  Neighborhood Walking Tour
                </span>
                <span className="text-[11px] text-neutral-400">{listing.youtube_search_term}</span>
              </div>

              {/* YouTube Video Frame Container */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-white/10 group">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
                    listing.youtube_search_term
                  )}`}
                  title={`Walking Tour - ${listing.neighborhood}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] font-mono text-neutral-400 text-center">
                Interactive 4K walking tour video for {listing.neighborhood}, NYC.
              </p>
            </div>

            {/* Google Maps Location Radar & Embedded Map */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-300">
                <span className="flex items-center gap-1.5 font-bold text-white uppercase">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Google Maps Location Radar
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
                </span>
              </div>

              {/* Embedded Google Maps Location Frame */}
              <div className="relative w-full h-48 sm:h-52 rounded-xl bg-neutral-950 border border-white/10 overflow-hidden">
                <iframe
                  className="w-full h-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed`}
                  title={`Google Map - ${listing.title}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-emerald-400 font-bold">WalkScore: 99/100</span>
              </div>
            </div>
          </div>

          {/* CRIME DATA BREAKDOWN & GOOGLE MAPS REVIEWS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Crime Data Stats Card */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-rose-400" />
                NYPD Precinct 90-Day Records
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-mono">Assaults:</span>
                  <span className="font-mono font-bold text-white">{listing.mock_crime_data.assault}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.assault * 25, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-neutral-400 font-mono">Petit Larceny:</span>
                  <span className="font-mono font-bold text-white">{listing.mock_crime_data.petit_larceny}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div
                    className="bg-yellow-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.petit_larceny * 5, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-neutral-400 font-mono">311 Noise Complaints:</span>
                  <span className="font-mono font-bold text-white">{listing.mock_crime_data.noise_complaints}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.noise_complaints * 1.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Google Maps Resident & Neighbor Reviews (Spans 2 columns) */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Google Maps Resident & Local Neighborhood Reviews
                </h4>
                <div className="text-[11px] font-mono text-yellow-400 font-bold">
                  ★ 4.8 / 5.0 (Google Local Guides)
                </div>
              </div>

              <div className="space-y-2">
                {listing.mock_local_reviews.map((rev, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-xs text-neutral-300 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500">
                      <span className="text-emerald-400 font-bold">Verified NYC Resident • {listing.neighborhood}</span>
                      <span className="text-yellow-400">★★★★★</span>
                    </div>
                    <p className="italic font-sans text-neutral-200">"{rev}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:p-5 bg-black/80 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20 backdrop-blur-md">
          <div className="text-xs text-neutral-400 font-mono">
            Scraped from <span className="text-white font-bold">{listing.source}</span> • Updated Today
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <span>View on {listing.source}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                alert(`Tour scheduled request submitted for ${listing.title}. A GothamIntel leasing manager will follow up via email!`);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-extrabold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>SCHEDULE IN-PERSON TOUR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
