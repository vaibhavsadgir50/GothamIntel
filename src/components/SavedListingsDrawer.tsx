import React from 'react';
import { X, Bookmark, Trash2, ExternalLink, Sparkles, MapPin, DollarSign, Share2 } from 'lucide-react';
import { Listing } from '../types';

interface SavedListingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedListings: Listing[];
  onRemoveSaved: (listingId: string) => void;
  onOpenIntelModal: (listing: Listing) => void;
}

export const SavedListingsDrawer: React.FC<SavedListingsDrawerProps> = ({
  isOpen,
  onClose,
  savedListings,
  onRemoveSaved,
  onOpenIntelModal,
}) => {
  if (!isOpen) return null;

  const totalMonthlyCost = savedListings.reduce((sum, l) => sum + l.price, 0);

  const handleExportBriefing = () => {
    const text = savedListings
      .map(
        (l) =>
          `• ${l.title} (${l.neighborhood}, ${l.borough}) - $${l.price}/mo - Bodega Score: ${l.bodega_index}/5`
      )
      .join('\n');
    navigator.clipboard.writeText(`GOTHAM INTEL SAVED SHORTLIST:\n${text}`);
    alert('Shortlist briefing copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-md bg-black/90 backdrop-blur-2xl border-l border-white/10 h-full p-6 flex flex-col justify-between text-white shadow-2xl space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            <div>
              <h2 className="text-lg font-bold font-mono text-white">SAVED GOTHAM SHORTLIST</h2>
              <p className="text-xs text-neutral-400 font-mono">
                {savedListings.length} {savedListings.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Listings Scroll List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {savedListings.length === 0 ? (
            <div className="py-20 text-center space-y-3 text-neutral-400 font-mono">
              <Bookmark className="w-12 h-12 mx-auto text-neutral-600" />
              <p className="text-sm">No saved listings yet.</p>
              <p className="text-xs text-neutral-500">
                Click the bookmark button on any Gotham card to add it to your shortlist!
              </p>
            </div>
          ) : (
            savedListings.map((listing) => (
              <div
                key={listing.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 group hover:border-emerald-500/40 transition-all"
              >
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {listing.neighborhood}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">{listing.title}</h4>
                  <div className="text-xs font-mono text-neutral-300 mt-0.5">
                    ${listing.price}/mo
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onOpenIntelModal(listing);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all"
                    title="View Intel"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveSaved(listing.id)}
                    className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/50 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Stats & Export */}
        {savedListings.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400">TOTAL COMBINED BUDGET:</span>
              <span className="text-lg font-bold text-white">
                ${totalMonthlyCost.toLocaleString()}/mo
              </span>
            </div>

            <button
              onClick={handleExportBriefing}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-extrabold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>COPY SHORTLIST BRIEFING</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
