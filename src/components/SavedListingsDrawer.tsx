import React from 'react';
import { X, Bookmark, Trash2, Sparkles, Share2 } from 'lucide-react';
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
    navigator.clipboard.writeText(`Gotham saved shortlist:\n${text}`);
    alert('Shortlist copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between text-slate-800 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-teal-600 fill-teal-100" />
            <div>
              <h2 className="text-lg font-bold font-display text-slate-800">Saved shortlist</h2>
              <p className="text-xs text-slate-500">
                {savedListings.length} {savedListings.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {savedListings.length === 0 ? (
            <div className="py-20 text-center space-y-3 text-slate-500">
              <Bookmark className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm">No saved listings yet.</p>
              <p className="text-xs text-slate-400">
                Click the bookmark button on any card to add it to your shortlist!
              </p>
            </div>
          ) : (
            savedListings.map((listing) => (
              <div
                key={listing.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 group hover:border-teal-300 transition-all"
              >
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-teal-700">
                    {listing.neighborhood}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 truncate">{listing.title}</h4>
                  <div className="text-xs text-slate-600 mt-0.5">
                    ${listing.price}/mo
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onOpenIntelModal(listing);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-all border border-teal-200"
                    title="View Intel"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveSaved(listing.id)}
                    className="p-2 rounded-lg bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {savedListings.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Total combined budget:</span>
              <span className="text-lg font-bold text-slate-800">
                ${totalMonthlyCost.toLocaleString()}/mo
              </span>
            </div>

            <button
              onClick={handleExportBriefing}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy shortlist</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
