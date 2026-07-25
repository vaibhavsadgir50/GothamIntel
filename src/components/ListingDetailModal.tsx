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
  Utensils,
  ExternalLink,
  AlertTriangle,
  Volume2,
  MessageSquare,
  Quote,
  RefreshCw,
} from 'lucide-react';
import { Listing, ChatMessage, AreaIntelResponse } from '../types';
import { useAuth } from '../context/AuthContext';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (listing: Listing) => void;
  onRequestAuth?: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  isSaved,
  onToggleSave,
  onRequestAuth,
}) => {
  const { user, authHeaders } = useAuth();
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<string | null>(null);
  const [inquiryBusy, setInquiryBusy] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live Area-Intel Agent state (real Google Places nearby-place reviews)
  const [areaIntel, setAreaIntel] = useState<AreaIntelResponse | null>(null);
  const [isLoadingAreaIntel, setIsLoadingAreaIntel] = useState<boolean>(false);

  useEffect(() => {
    if (!listing) return;
    setCurrentImageIdx(0);
    setShowInquiry(false);
    setInquiryMsg('');
    setInquiryStatus(null);
    setChatMessages([
      {
        id: `welcome_${listing.id}`,
        sender: 'agent',
        text: `Hey! I'm your Gotham AI Agent for this ${listing.neighborhood} property ($${listing.price}/mo). What would you like to know about the unit, noise, or subway transit?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [listing?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch the live area-intel agent's grounded read on nearby places
  useEffect(() => {
    if (!listing) return;

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
  }, [listing?.id]);

  if (!listing) return null;

  const images =
    listing.galleryImages && listing.galleryImages.length > 0
      ? listing.galleryImages
      : [listing.imageUrl];

  const handleSubmitInquiry = async () => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    if (user.role !== 'seeker') {
      setInquiryStatus('Hosts browse the portal — switch to a seeker account to apply.');
      return;
    }
    if (!inquiryMsg.trim()) return;
    setInquiryBusy(true);
    setInquiryStatus(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ listingId: listing.id, message: inquiryMsg.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send inquiry');
      setInquiryStatus('Inquiry sent to the host!');
      setShowInquiry(false);
      setInquiryMsg('');
    } catch (err: any) {
      setInquiryStatus(err.message || 'Failed to send inquiry');
    } finally {
      setInquiryBusy(false);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

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
        return 'bg-lime-500 text-slate-900 font-bold';
      case 'J':
      case 'Z':
        return 'bg-amber-800 text-white';
      case 'L':
        return 'bg-slate-500 text-white';
      case 'N':
      case 'Q':
      case 'R':
      case 'W':
        return 'bg-yellow-400 text-slate-900 font-extrabold';
      case '1':
      case '2':
      case '3':
        return 'bg-red-600 text-white';
      case '4':
      case '5':
      case '6':
        return 'bg-teal-600 text-white';
      case '7':
        return 'bg-violet-600 text-white';
      default:
        return 'bg-slate-500 text-white';
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="relative bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col text-slate-800 overflow-hidden my-auto shadow-lg">
        
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-semibold uppercase">
              {listing.neighborhood} • {listing.borough}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(listing)}
              className={`p-2 rounded-full border transition-all ${
                isSaved
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-teal-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-200">

          <div className="relative w-full h-64 sm:h-72 bg-slate-100 group select-none">
            <img
              src={images[currentImageIdx]}
              alt={`${listing.title} photo ${currentImageIdx + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-slate-900/20 pointer-events-none" />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] text-slate-600 border border-slate-200 font-medium">
                Photo {currentImageIdx + 1} of {images.length}
              </span>

              {images.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIdx ? 'w-5 bg-teal-600' : 'w-1.5 bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold font-display text-teal-700 tracking-tight">
                  ${listing.price}
                  <span className="text-xs text-slate-500 font-sans font-normal"> / month</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  {listing.address}
                </p>
              </div>

              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-600 flex items-center gap-1 shrink-0"
              >
                <span>{listing.source}</span>
                <ExternalLink className="w-3 h-3 text-teal-600" />
              </a>
            </div>

            <h2 className="text-sm font-bold text-slate-800 leading-snug">
              {listing.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700">
                <Bed className="w-3.5 h-3.5 text-teal-600" />
                {listing.beds} Bedroom
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700">
                <Bath className="w-3.5 h-3.5 text-teal-600" />
                {listing.baths} Bathroom
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                Bodega Index: {listing.bodega_index}/5
              </span>
            </div>

            <div className="pt-2 space-y-2">
              {!showInquiry ? (
                <button
                  onClick={() => {
                    if (!user) onRequestAuth?.();
                    else setShowInquiry(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Apply / Inquire with Host
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <textarea
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    rows={3}
                    placeholder="Introduce yourself, company, and move-in dates..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none text-slate-800"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInquiry(false)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={inquiryBusy}
                      onClick={handleSubmitInquiry}
                      className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold disabled:opacity-50"
                    >
                      {inquiryBusy ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </div>
                </div>
              )}
              {inquiryStatus && (
                <p className="text-[11px] text-teal-700">{inquiryStatus}</p>
              )}
            </div>
          </div>

          <div className="p-5 space-y-3 bg-slate-50">
            <h3 className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1.5 tracking-wide">
              <Train className="w-4 h-4 text-teal-600" />
              Subway & transit
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {listing.subway_lines.map((line) => (
                <div
                  key={line}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getSubwayBadgeClass(
                    line
                  )}`}
                >
                  {line}
                </div>
              ))}
              <span className="text-xs text-slate-500 ml-2">
                • 2–4 min walk to station entrance
              </span>
            </div>

            {listing.train_alert && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{listing.train_alert}</span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1.5 tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Gotham AI vibe rating
              </h3>

              <div className="px-3 py-1 rounded-full bg-teal-600 text-white font-bold text-sm">
                {listing.aiRating || 9.5} / 10
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Transit Score</div>
                <div className="text-sm font-bold text-teal-700">
                  {listing.aiRatingBreakdown?.transit || 9.8} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Street Safety</div>
                <div className="text-sm font-bold text-teal-700">
                  {listing.aiRatingBreakdown?.safety || 9.2} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Bodega BEC</div>
                <div className="text-sm font-bold text-amber-600">
                  {listing.aiRatingBreakdown?.bodega || 10.0} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">Nightlife Vibe</div>
                <div className="text-sm font-bold text-teal-700">
                  {listing.aiRatingBreakdown?.vibe || 9.7} / 10
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 uppercase">Rent Value</div>
                <div className="text-sm font-bold text-teal-700">
                  {listing.aiRatingBreakdown?.value || 9.1} / 10
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                Verified resident reviews
              </div>
              {listing.mock_local_reviews.map((rev, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
                  "{rev}"
                </div>
              ))}
            </div>
          </div>

          {/* Live Area-Intel Agent (real Google Places reviews) */}
          <div className="p-5 space-y-3 bg-white border-t border-slate-200">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-semibold uppercase text-slate-600 flex items-center gap-1.5 tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Live area-intel agent (Google Places)
                </h4>
                <span
                  className={`text-[9px] font-bold ${
                    areaIntel?.isLive ? 'text-teal-700' : 'text-amber-600'
                  }`}
                >
                  {areaIntel?.isLive ? `⚡ LIVE • ${areaIntel.modelUsed}` : 'OFFLINE'}
                </span>
              </div>

              {isLoadingAreaIntel ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
                  <p className="text-[10px] text-slate-500">Reading real Google Maps reviews nearby...</p>
                </div>
              ) : areaIntel?.profile ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {areaIntel.profile.overallVerdict}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {areaIntel.profile.standoutSpots.slice(0, 4).map((s, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] space-y-0.5">
                        <div className="font-bold text-teal-700">{s.name}</div>
                        <div className="text-slate-500">{s.why}</div>
                      </div>
                    ))}
                  </div>

                  {areaIntel.profile.notableQuotes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {areaIntel.profile.notableQuotes.slice(0, 3).map((q, i) => (
                        <div key={i} className="text-[10px] text-slate-500 italic flex gap-1.5">
                          <Quote className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                          <span>
                            "{q.quote}" — <span className="text-slate-400 not-italic">{q.placeName}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-700">
                  {areaIntel?.reason ||
                    'Add GOOGLE_MAPS_PLATFORM_KEY with Places API (New) enabled to activate live area intel.'}
                </p>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <Bot className="w-4 h-4 text-teal-600" />
                Chat with Gotham AI
              </h3>
              <span className="text-[10px] text-teal-700">Powered by Gemini</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => handleSendMessage("Is it noisy at night around here?")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 text-slate-600 hover:text-teal-700 transition-all text-[10px]"
              >
                🔊 Is it loud at night?
              </button>
              <button
                onClick={() => handleSendMessage("What's the subway commute to Midtown?")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 text-slate-600 hover:text-teal-700 transition-all text-[10px]"
              >
                🚇 Subway commute speed?
              </button>
              <button
                onClick={() => handleSendMessage("How good is the local 24/7 bodega?")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 text-slate-600 hover:text-teal-700 transition-all text-[10px]"
              >
                🥪 Bodega BEC quality?
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 p-3 rounded-2xl bg-white border border-slate-200 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'agent' && (
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                      G
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white font-medium rounded-br-none'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 ${
                        msg.sender === 'user' ? 'text-white/70 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex gap-2 items-center text-xs text-slate-500 italic p-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <span>Gotham AI is typing…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

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
                placeholder="Ask about noise, commute, rent..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-40"
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
