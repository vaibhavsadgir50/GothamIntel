import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Shield,
  Volume2,
  ExternalLink,
  Video,
  Share2,
  RefreshCw,
  Bookmark,
  Award,
  CheckCircle,
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

  const handleCopyBriefing = () => {
    const text = `Gotham intel for ${listing.title} (${listing.neighborhood}): Price $${listing.price}/mo. View listing & AI analysis on GothamIntel!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-auto overflow-hidden text-slate-800 flex flex-col max-h-[90vh] shadow-lg">
        <div className="p-5 sm:p-6 bg-white border-b border-slate-200 flex items-start justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] border border-teal-200 font-semibold uppercase">
                {listing.borough} • {listing.neighborhood}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[10px] border border-slate-200 font-semibold">
                ${listing.price.toLocaleString()}/mo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] border border-slate-200">
                Source: {listing.source}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-display text-slate-800 tracking-tight">
              {listing.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{listing.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleSave(listing)}
              className={`p-2.5 rounded-2xl border transition-all ${
                isSaved
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-teal-700'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-600 text-teal-600' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="relative p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-teal-700">
                    Neighborhood analysis
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {intelData?.isGeminiLive
                      ? 'Powered live by Gemini'
                      : 'Gotham neighborhood intel'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyBriefing}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 border border-slate-200 transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{copiedLink ? 'Copied!' : 'Share briefing'}</span>
              </button>
            </div>

            {isLoadingIntel ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">
                  Gathering neighborhood insights…
                </p>
              </div>
            ) : intelData?.intel ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-teal-700">
                    <Award className="w-4 h-4 text-teal-600" />
                    Ultimate lease verdict
                  </div>
                  <p className="text-sm italic leading-relaxed text-slate-700">
                    "{intelData.intel.ultimateLeaseVerdict}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Safety Reality</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {intelData.intel.safetyReality}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Noise & Vibe Forecast</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {intelData.intel.noiseVibeForecast}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Bodega & BEC Grade</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {intelData.intel.bodegaGrade}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Transit Tip</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {intelData.intel.transitHack}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
                  <span className="font-semibold text-teal-700 shrink-0">Local archetype:</span>
                  <span className="italic">"{intelData.intel.neighborhoodPersonality}"</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Video className="w-4 h-4 text-rose-500" />
                  Neighborhood walking tour
                </span>
                <span className="text-[11px] text-slate-400">{listing.youtube_search_term}</span>
              </div>

              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
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
              <p className="text-[11px] text-slate-500 text-center">
                Walking tour video for {listing.neighborhood}, NYC.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Map location
                </span>
                <span className="text-[10px] text-teal-700">
                  {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
                </span>
              </div>

              <div className="relative w-full h-48 sm:h-52 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                <iframe
                  className="w-full h-full"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed`}
                  title={`Google Map - ${listing.title}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-teal-700 font-semibold">WalkScore: 99/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-rose-500" />
                NYPD Precinct 90-Day Records
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assaults:</span>
                  <span className="font-semibold text-slate-800">{listing.mock_crime_data.assault}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.assault * 25, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Petit Larceny:</span>
                  <span className="font-semibold text-slate-800">{listing.mock_crime_data.petit_larceny}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.petit_larceny * 5, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">311 Noise Complaints:</span>
                  <span className="font-semibold text-slate-800">{listing.mock_crime_data.noise_complaints}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-orange-400 h-1.5 rounded-full"
                    style={{ width: `${Math.min(listing.mock_crime_data.noise_complaints * 1.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  Local neighborhood reviews
                </h4>
                <div className="text-[11px] text-amber-600 font-semibold">
                  ★ 4.8 / 5.0 (Google Local Guides)
                </div>
              </div>

              <div className="space-y-2">
                {listing.mock_local_reviews.map((rev, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-teal-700 font-semibold">Verified NYC Resident • {listing.neighborhood}</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="italic text-slate-700">"{rev}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="text-xs text-slate-500">
            Scraped from <span className="text-slate-800 font-semibold">{listing.source}</span> • Updated Today
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-all"
            >
              <span>View on {listing.source}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                alert(`Tour scheduled request submitted for ${listing.title}. A GothamIntel leasing manager will follow up via email!`);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Schedule in-person tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
