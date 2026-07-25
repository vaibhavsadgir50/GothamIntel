import React from 'react';
import {
  Bookmark,
  Sparkles,
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
  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case 'StreetEasy':
        return 'bg-sky-600 text-white font-bold uppercase text-[10px] tracking-wider';
      case 'Zillow':
        return 'bg-teal-600 text-white font-bold uppercase text-[10px] tracking-wider';
      case 'Apartments.com':
        return 'bg-amber-600 text-white font-bold uppercase text-[10px] tracking-wider';
      default:
        return 'bg-slate-500 text-white font-bold uppercase text-[10px] tracking-wider';
    }
  };

  const getSubwayPillStyle = (line: string) => {
    const l = line.toUpperCase();
    if (['A', 'C', 'E'].includes(l)) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (['B', 'D', 'F', 'M'].includes(l)) return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (['G'].includes(l)) return 'bg-lime-100 text-lime-700 border border-lime-200';
    if (['J', 'Z'].includes(l)) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (['L'].includes(l)) return 'bg-slate-100 text-slate-600 border border-slate-200';
    if (['N', 'Q', 'R', 'W'].includes(l)) return 'bg-yellow-400 text-slate-900 font-black';
    if (['1', '2', '3'].includes(l)) return 'bg-red-600 text-white font-bold';
    if (['4', '5', '6'].includes(l)) return 'bg-teal-600 text-white font-bold';
    if (['7'].includes(l)) return 'bg-violet-600 text-white font-bold';
    return 'bg-slate-500 text-white';
  };

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-teal-300 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] ${getSourceBadgeStyle(
              listing.source
            )}`}
          >
            {listing.source}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(listing);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl border transition-all ${
            isSaved
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'bg-white/90 border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Listing'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white text-white' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold text-white font-display tracking-tight">
              ${listing.price.toLocaleString()}<span className="text-xs text-white/80 font-normal">/mo</span>
            </div>
            <div className="text-xs text-white/80">
              {listing.neighborhood}, {listing.borough}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {listing.subway_lines.map((line) => (
              <span
                key={line}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getSubwayPillStyle(
                  line
                )}`}
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1 text-sm">
            {listing.title}
          </h3>

          <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
            <div className="flex gap-3">
              <span>{listing.beds} Bed</span>
              <span>•</span>
              <span>{listing.baths} Bath</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Bodega:</span>
              <span>{'🥪'.repeat(listing.bodega_index)}</span>
            </div>
          </div>
        </div>

        {listing.train_alert ? (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-700">
            ⚠️ <span className="font-bold">Transit Note:</span> {listing.train_alert}
          </div>
        ) : (
          <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-[10px] text-teal-700">
            ✅ <span className="font-bold">Neighborhood vibe:</span> Walk score 95+. Prime residential spot.
          </div>
        )}

        <button
          onClick={() => onOpenIntelModal(listing)}
          className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all group/btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600 group-hover/btn:rotate-12 transition-transform" />
          <span>View details</span>
          <Eye className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        </button>
      </div>
    </div>
  );
};
