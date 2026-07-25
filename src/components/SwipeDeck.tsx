import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  X,
  Heart,
  RotateCcw,
  Sparkles,
  Info,
  MapPin,
  Bed,
  Bath,
  Train,
  Star,
  ChevronRight,
  ShieldCheck,
  Building2,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { Listing, AreaStampResponse } from '../types';

interface SwipeDeckProps {
  listings: Listing[];
  onOpenDetail: (listing: Listing) => void;
  onInterest: (listing: Listing, interested: boolean) => void;
  savedListingIds: string[];
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  listings,
  onOpenDetail,
  onInterest,
  savedListingIds,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityLeft = useTransform(x, [-150, -20], [1, 0]);
  const opacityRight = useTransform(x, [20, 150], [0, 1]);

  const activeListing = listings[currentIndex];

  // Neighborhood Stamp (Creative Direction Agent -> Nano Banana image agent),
  // shown as a badge stamped on the poster card itself. Cached client-side by
  // listing id and prefetched a few cards ahead so the image is already
  // warm (server-cached + fetched) by the time the user swipes to it.
  const STAMP_PREFETCH_AHEAD = 2;
  const [stampsById, setStampsById] = useState<Record<string, AreaStampResponse>>({});
  const stampsRef = useRef<Record<string, AreaStampResponse>>({});
  const stampInFlightRef = useRef<Set<string>>(new Set());

  const fetchStamp = (listingId: string) => {
    if (stampsRef.current[listingId] || stampInFlightRef.current.has(listingId)) return;
    stampInFlightRef.current.add(listingId);

    fetch(`/api/area-stamp/${listingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Stamp generation failed');
        return res.json();
      })
      .then((data: AreaStampResponse) => {
        stampsRef.current[listingId] = data;
        setStampsById((prev) => ({ ...prev, [listingId]: data }));
      })
      .catch((err) => console.error('Error generating neighborhood stamp:', err))
      .finally(() => {
        stampInFlightRef.current.delete(listingId);
      });
  };

  useEffect(() => {
    for (let i = currentIndex; i <= currentIndex + STAMP_PREFETCH_AHEAD; i++) {
      const upcoming = listings[i];
      if (upcoming) fetchStamp(upcoming.id);
    }
  }, [currentIndex, listings]);

  const stamp = activeListing ? stampsById[activeListing.id] : undefined;
  const isLoadingStamp = !!activeListing && !stamp;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!activeListing) return;

    setSwipeDirection(direction);
    onInterest(activeListing, direction === 'right');
    setHistory((prev) => [...prev, currentIndex]);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);
      x.set(0);
    }, 250);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousIndex = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(previousIndex);
    x.set(0);
  };

  const handleResetStack = () => {
    setCurrentIndex(0);
    setHistory([]);
    x.set(0);
  };

  // Color map for NYC MTA Subway Lines
  const getSubwayBadgeClass = (line: string) => {
    switch (line.toUpperCase()) {
      case 'A':
      case 'C':
      case 'E':
        return 'bg-blue-600 text-white';
      case 'B':
      case 'D':
      case 'F':
      case 'M':
        return 'bg-orange-500 text-white';
      case 'G':
        return 'bg-lime-500 text-black font-bold';
      case 'J':
      case 'Z':
        return 'bg-amber-800 text-white';
      case 'L':
        return 'bg-neutral-600 text-white';
      case 'N':
      case 'Q':
      case 'R':
      case 'W':
        return 'bg-yellow-400 text-black font-extrabold';
      case '1':
      case '2':
      case '3':
        return 'bg-red-600 text-white';
      case '4':
      case '5':
      case '6':
        return 'bg-emerald-600 text-white';
      case '7':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-neutral-700 text-white';
    }
  };

  if (!activeListing || currentIndex >= listings.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-sm mx-auto my-12 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black font-mono text-white uppercase tracking-tight">
            DECK EXHAUSTED!
          </h3>
          <p className="text-xs text-neutral-400 font-mono leading-relaxed">
            You've reviewed all available Gotham property cards in this queue. Reset your stack or inspect your saved shortlist.
          </p>
        </div>

        <button
          onClick={handleResetStack}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>SWIPE AGAIN FROM TOP</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 flex flex-col justify-between items-center h-[calc(100vh-140px)] max-h-[720px]">
      {/* Swipe Deck Header Progress Bar */}
      <div className="w-full flex items-center justify-between font-mono text-[11px] text-neutral-400 mb-2">
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          SWIPE MODE
        </span>
        <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-white font-bold">
          {currentIndex + 1} / {listings.length}
        </span>
      </div>

      {/* Swipeable Card Stack Container */}
      <div className="relative w-full flex-1 max-h-[580px] perspective-1000">
        <AnimatePresence>
          <motion.div
            key={activeListing.id}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 100) {
                handleSwipe('right');
              } else if (info.offset.x < -100) {
                handleSwipe('left');
              }
            }}
            onClick={() => onOpenDetail(activeListing)}
            className="absolute inset-0 w-full h-full rounded-3xl bg-neutral-900 border border-white/20 shadow-2xl overflow-hidden cursor-pointer select-none group"
            whileTap={{ scale: 0.98 }}
          >
            {/* Card Main Image */}
            <div className="relative w-full h-full">
              <img
                src={activeListing.imageUrl}
                alt={activeListing.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

              {/* Swipe Right Overlay Badge: INTERESTED */}
              <motion.div
                style={{ opacity: opacityRight }}
                className="absolute top-8 left-8 z-30 transform -rotate-12 px-4 py-2 rounded-2xl bg-emerald-500 text-black border-2 border-white font-black font-mono text-xl tracking-widest uppercase shadow-2xl pointer-events-none flex items-center gap-2"
              >
                <Heart className="w-6 h-6 fill-black" />
                <span>INTERESTED</span>
              </motion.div>

              {/* Swipe Left Overlay Badge: NOT INTERESTED */}
              <motion.div
                style={{ opacity: opacityLeft }}
                className="absolute top-8 right-8 z-30 transform rotate-12 px-4 py-2 rounded-2xl bg-rose-600 text-white border-2 border-white font-black font-mono text-xl tracking-widest uppercase shadow-2xl pointer-events-none flex items-center gap-2"
              >
                <X className="w-6 h-6" />
                <span>NOPE</span>
              </motion.div>

              {/* Top Card Badges */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                {/* AI Rating Badge */}
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{activeListing.aiRating || 9.5}/10 AI Vibe</span>
                </div>

                <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold uppercase">
                  {activeListing.neighborhood}
                </div>
              </div>

              {/* Neighborhood Stamp — Gen Z infographic stamp, agent-generated per area,
                  stamped directly onto the poster (not buried in the details modal) */}
              <div className="absolute top-28 sm:top-32 right-4 z-20 pointer-events-none transform rotate-[-6deg]">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-2xl border-[4px] border-white shadow-2xl overflow-hidden bg-black/60 backdrop-blur-md flex items-center justify-center">
                  {isLoadingStamp ? (
                    <div className="flex flex-col items-center gap-1.5 text-neutral-300">
                      <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                      <span className="text-[9px] font-mono">Stamping...</span>
                    </div>
                  ) : stamp ? (
                    <img
                      src={stamp.imageDataUrl}
                      alt={`${activeListing.neighborhood} neighborhood stamp`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-7 h-7 text-neutral-500" />
                  )}
                </div>
              </div>

              {/* Tap for Details Hint Prompt Floating */}
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 bg-emerald-500/90 text-black px-3 py-1 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1 shadow-lg animate-bounce pointer-events-none">
                <Maximize2 className="w-3 h-3" />
                <span>TAP CONTAINER FOR DETAILS & CHAT</span>
              </div>

              {/* Bottom Information Box Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-20 space-y-2 text-white pointer-events-none">
                {/* Price & Specs Row */}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-md">
                      ${activeListing.price}
                    </span>
                    <span className="text-xs font-mono text-neutral-300 ml-1">/month</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-neutral-200 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-emerald-400" />
                      {activeListing.beds} Bed
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-emerald-400" />
                      {activeListing.baths} Bath
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base font-bold line-clamp-2 leading-tight drop-shadow">
                  {activeListing.title}
                </h2>

                {/* Subway Train Lines Row */}
                <div className="flex items-center justify-between pt-1 border-t border-white/15">
                  <div className="flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex items-center gap-1">
                      {activeListing.subway_lines.map((line) => (
                        <span
                          key={line}
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${getSubwayBadgeClass(
                            line
                          )}`}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-300 flex items-center gap-1">
                    <span>Inspect Intel</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Touch Action Controls Row */}
      <div className="w-full flex items-center justify-evenly py-3">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full bg-neutral-900 border border-white/15 hover:border-yellow-400/50 text-neutral-400 hover:text-yellow-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg active:scale-90"
          title="Rewind Last Swipe"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Swipe Left / Not Interested (Red X) */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-rose-500/60 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all active:scale-90"
          title="Not Interested"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Expand Details & AI Chat (Blue Info) */}
        <button
          onClick={() => activeListing && onOpenDetail(activeListing)}
          className="w-12 h-12 rounded-full bg-neutral-900 border border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-lg"
          title="View Slideshow & Chat"
        >
          <Info className="w-6 h-6" />
        </button>

        {/* Swipe Right / Interested (Emerald Heart) */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all active:scale-90"
          title="Interested / Save Listing"
        >
          <Heart className="w-8 h-8 fill-black" />
        </button>
      </div>
    </div>
  );
};
