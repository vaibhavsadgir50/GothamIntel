import React from 'react';
import {
  MapPin,
  Bed,
  Bath,
  Train,
  ExternalLink,
  Bookmark,
  Sparkles,
  AlertTriangle,
  Utensils,
  Eye,
} from 'lucide-react';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (listing: Listing) => void;
  onOpenIntelModal: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isSaved,
  onToggleSave,
  onOpenIntelModal,
}) => {
  // Source branding badge styling
  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case 'StreetEasy':
        return 'bg-blue-600 text-white font-bold uppercase text-[10px] tracking-wider';
      case 'Zillow':
        return 'bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider';
      case 'Apartments.com':
        return 'bg-amber-600 text-white font-bold uppercase text-[10px] tracking-wider';
      default:
        return 'bg-neutral-600 text-white font-bold uppercase text-[10px] tracking-wider';
    }
  };

  // Subway line color helper
  const getSubwayPillStyle = (line: string) => {
    const l = line.toUpperCase();
    if (['A', 'C', 'E'].includes(l)) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30';
    if (['B', 'D', 'F', 'M'].includes(l)) return 'bg-orange-500/20 text-orange-400 border border-orange-400/30';
    if (['G'].includes(l)) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30';
    if (['J', 'Z'].includes(l)) return 'bg-amber-700/20 text-amber-400 border border-amber-400/30';
    if (['L'].includes(l)) return 'bg-neutral-500/20 text-neutral-300 border border-neutral-400/30';
    if (['N', 'Q', 'R', 'W'].includes(l)) return 'bg-yellow-400 text-black font-black';
    if (['1', '2', '3'].includes(l)) return 'bg-red-600 text-white font-bold';
    if (['4', '5', '6'].includes(l)) return 'bg-emerald-600 text-white font-bold';
    if (['7'].includes(l)) return 'bg-purple-600 text-white font-bold';
    return 'bg-neutral-700 text-white';
  };

  return (
    <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      {/* Top Image Section with Source Badge & Price Tag */}
      <div className="relative h-44 w-full overflow-hidden bg-neutral-800">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Found on Source Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded shadow-sm text-[10px] ${getSourceBadgeStyle(
              listing.source
            )}`}
          >
            {listing.source}
          </span>
        </div>

        {/* Bookmark Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(listing);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
            isSaved
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
              : 'bg-black/50 border-white/20 text-neutral-300 hover:text-white hover:bg-black/70'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Listing'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-400 text-emerald-400' : ''}`} />
        </button>

        {/* Monthly Price & Neighborhood Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold text-white font-sans tracking-tight">
              ${listing.price.toLocaleString()}<span className="text-xs text-neutral-300 font-sans font-normal">/mo</span>
            </div>
            <div className="text-xs text-neutral-300 font-sans">
              {listing.neighborhood}, {listing.borough}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {listing.subway_lines.map((line) => (
              <span
                key={line}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${getSubwayPillStyle(
                  line
                )}`}
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Listing Card Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Listing Title */}
          <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-300 transition-colors line-clamp-1 text-sm">
            {listing.title}
          </h3>

          <div className="flex justify-between items-center text-xs text-neutral-400 mt-2">
            <div className="flex gap-3">
              <span>{listing.beds} Bed</span>
              <span>•</span>
              <span>{listing.baths} Bath</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-neutral-500">Bodega:</span>
              <span>{'🥪'.repeat(listing.bodega_index)}</span>
            </div>
          </div>
        </div>

        {/* Subway Alert Warning or Intel Badge Banner */}
        {listing.train_alert ? (
          <div className="p-2 bg-red-950/30 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-sans">
            ⚠️ <span className="font-bold">Transit Note:</span> {listing.train_alert}
          </div>
        ) : (
          <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-sans">
            ✅ <span className="font-bold">Neighborhood Vibe:</span> Walk score 95+. Prime residential spot.
          </div>
        )}

        {/* Footer CTA Button */}
        <button
          onClick={() => onOpenIntelModal(listing)}
          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-neutral-200 hover:text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all group/btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:rotate-12 transition-transform" />
          <span>INSPECT INTEL</span>
          <Eye className="w-3.5 h-3.5 text-neutral-400 ml-auto" />
        </button>
      </div>
    </div>
  );
};
