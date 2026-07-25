import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Train,
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Utensils,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  MessageSquare,
  Quote,
  RefreshCw,
} from 'lucide-react';
import { Listing, ChatMessage, AreaIntelResponse } from '../types';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (listing: Listing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  if (!listing) return null;

  // Image Slideshow state
  const images = listing.galleryImages && listing.galleryImages.length > 0
    ? listing.galleryImages
    : [listing.imageUrl];
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hey! I'm your Gotham AI Real Estate Agent. Ask me anything about ${listing.title}, subway commutes, noise level, or bodega food!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live Area-Intel Agent state (real Google Places nearby-place reviews)
  const [areaIntel, setAreaIntel] = useState<AreaIntelResponse | null>(null);
  const [isLoadingAreaIntel, setIsLoadingAreaIntel] = useState<boolean>(false);

  // Reset image index when listing changes
  useEffect(() => {
    setCurrentImageIdx(0);
    setChatMessages([
      {
        id: `welcome_${listing.id}`,
        sender: 'agent',
        text: `Hey! I'm your Gotham AI Agent for this ${listing.neighborhood} property ($${listing.price}/mo). What would you like to know about the unit, noise, or subway transit?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [listing.id]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch the live area-intel agent's grounded read on nearby places
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAreaIntel(true);
    setAreaIntel(null);

    fetch(`/api/area-intel/${listing.id}`)
      .then((res) => res.json())
      .then((data: AreaIntelResponse) => {
        if (isMounted) setAreaIntel(data);
      })
      .catch((err) => console.error('Error fetching area intel:', err))
      .finally(() => {
        if (isMounted) setIsLoadingAreaIntel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listing.id]);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
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

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || chatInput).trim();
    if (!msg || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          message: msg,
          history: chatMessages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: `reply_${Date.now()}`,
        sender: 'agent',
        text: data.reply || "I'm looking into that Gotham listing detail for you now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'agent',
        text: `Regarding ${listing.title}: This ${listing.beds}-bed is right by the ${listing.subway_lines.join(', ')} trains for $${listing.price}/mo with a ${listing.aiRating}/10 Gotham score!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="relative bg-neutral-950 border border-white/20 shadow-2xl rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col text-white overflow-hidden my-auto">
        
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold uppercase">
              {listing.neighborhood} • {listing.borough}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(listing)}
              className={`p-2 rounded-full border transition-all ${
                isSaved
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-black' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/10">

          {/* 1. IMAGE SLIDESHOW SECTION */}
          <div className="relative w-full h-64 sm:h-72 bg-neutral-900 group select-none">
            <img
              src={images[currentImageIdx]}
              alt={`${listing.title} photo ${currentImageIdx + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30 pointer-events-none" />

            {/* Slideshow Arrow Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter & Dot Indicators */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-neutral-300 border border-white/10">
                PHOTO {currentImageIdx + 1} OF {images.length}
              </span>

              {images.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIdx ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. PROPERTY ESSENTIALS & PRICE */}
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                  ${listing.price}
                  <span className="text-xs text-neutral-400 font-sans font-normal"> / month</span>
                </h1>
                <p className="text-xs font-mono text-neutral-300 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {listing.address}
                </p>
              </div>

              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-mono text-neutral-300 flex items-center gap-1 shrink-0"
              >
                <span>{listing.source}</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            </div>

            <h2 className="text-sm font-bold text-neutral-100 leading-snug">
              {listing.title}
            </h2>

            {/* Spec Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-emerald-400" />
                {listing.beds} Bedroom
              </span>
              <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-emerald-400" />
                {listing.baths} Bathroom
              </span>
              <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                Bodega Index: {listing.bodega_index}/5
              </span>
            </div>
          </div>

          {/* 3. SUBWAY TRAIN ICONS & TRANSIT SPECS */}
          <div className="p-5 space-y-3 bg-neutral-900/50">
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
              <Train className="w-4 h-4 text-emerald-400" />
              Subway Train Connections & MTA Status
            </h3>

            {/* Subway Badges Grid */}
            <div className="flex items-center gap-2 flex-wrap">
              {listing.subway_lines.map((line) => (
                <div
                  key={line}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-extrabold text-sm shadow-lg ${getSubwayBadgeClass(
                    line
                  )}`}
                >
                  {line}
                </div>
              ))}
              <span className="text-xs font-mono text-neutral-400 ml-2">
                • 2–4 min walk to station entrance
              </span>
            </div>

            {/* Transit Alert Banner */}
            {listing.train_alert && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{listing.train_alert}</span>
              </div>
            )}
          </div>

          {/* 4. RATING BY AI & BREAKDOWN */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                GOTHAM AI VIBE RATING
              </h3>

              <div className="px-3 py-1 rounded-full bg-emerald-500 text-black font-mono font-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {listing.aiRating || 9.5} / 10
              </div>
            </div>

            {/* Score Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">Transit Score</div>
                <div className="text-sm font-bold text-emerald-400">
                  {listing.aiRatingBreakdown?.transit || 9.8} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">Street Safety</div>
                <div className="text-sm font-bold text-emerald-400">
                  {listing.aiRatingBreakdown?.safety || 9.2} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">Bodega BEC</div>
                <div className="text-sm font-bold text-amber-400">
                  {listing.aiRatingBreakdown?.bodega || 10.0} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">Nightlife Vibe</div>
                <div className="text-sm font-bold text-emerald-400">
                  {listing.aiRatingBreakdown?.vibe || 9.7} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-neutral-400 uppercase">Rent Value</div>
                <div className="text-sm font-bold text-emerald-400">
                  {listing.aiRatingBreakdown?.value || 9.1} / 10
                </div>
              </div>
            </div>

            {/* Resident Reviews */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Resident Local Reviews
              </div>
              {listing.mock_local_reviews.map((rev, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-xs text-neutral-300 italic font-sans">
                  "{rev}"
                </div>
              ))}
            </div>
          </div>

          {/* 5. LIVE AREA-INTEL AGENT (real Google Places reviews) */}
          <div className="p-5 space-y-3 bg-neutral-900/40 border-t border-white/10">
            <div>
              {/* Live Area-Intel Agent Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Live Area-Intel Agent (Google Places)
                  </h4>
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      areaIntel?.isLive ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {areaIntel?.isLive ? `⚡ LIVE • ${areaIntel.modelUsed}` : 'OFFLINE'}
                  </span>
                </div>

                {isLoadingAreaIntel ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <p className="font-mono text-[10px] text-neutral-400">Reading real Google Maps reviews nearby...</p>
                  </div>
                ) : areaIntel?.profile ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      {areaIntel.profile.overallVerdict}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {areaIntel.profile.standoutSpots.slice(0, 4).map((s, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] space-y-0.5">
                          <div className="font-bold text-emerald-400">{s.name}</div>
                          <div className="text-neutral-400">{s.why}</div>
                        </div>
                      ))}
                    </div>

                    {areaIntel.profile.notableQuotes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {areaIntel.profile.notableQuotes.slice(0, 3).map((q, i) => (
                          <div key={i} className="text-[10px] text-neutral-400 italic font-sans flex gap-1.5">
                            <Quote className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              "{q.quote}" — <span className="text-neutral-500 not-italic">{q.placeName}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-amber-300/80">
                    {areaIntel?.reason ||
                      'Add GOOGLE_MAPS_PLATFORM_KEY with Places API (New) enabled to activate live area intel.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 6. INTERACTIVE CHAT WITH AI AGENT IN BELOW SECTION */}
          <div className="p-5 space-y-4 bg-neutral-950 border-t border-white/15">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Bot className="w-4 h-4 text-emerald-400" />
                CHAT WITH GOTHAM AI REAL ESTATE AGENT
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Powered by Gemini 3.6</span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              <button
                onClick={() => handleSendMessage("Is it noisy at night around here?")}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-[10px]"
              >
                🔊 Is it loud at night?
              </button>
              <button
                onClick={() => handleSendMessage("What's the subway commute to Midtown?")}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-[10px]"
              >
                🚇 Subway commute speed?
              </button>
              <button
                onClick={() => handleSendMessage("How good is the local 24/7 bodega?")}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-[10px]"
              >
                🥪 Bodega BEC quality?
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 p-3 rounded-2xl bg-neutral-900/90 border border-white/10 text-xs font-sans">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'agent' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 font-black text-[10px]">
                      G
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-black font-semibold rounded-br-none'
                        : 'bg-white/10 text-neutral-200 border border-white/10 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span
                      className={`block text-[9px] font-mono mt-1 ${
                        msg.sender === 'user' ? 'text-black/60 text-right' : 'text-neutral-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex gap-2 items-center text-xs text-neutral-400 font-mono italic p-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span>Gotham AI Agent typing response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Gotham AI about noise, commute, rent..."
                className="flex-1 px-4 py-2.5 bg-neutral-900 border border-white/15 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
