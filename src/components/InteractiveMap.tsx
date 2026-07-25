import React, { useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Bed, Bath, Sparkles, Eye, X, Train, ShieldCheck, RefreshCw } from 'lucide-react';
import { Listing } from '../types';

interface InteractiveMapProps {
  listings: Listing[];
  onOpenIntelModal: (listing: Listing) => void;
  savedListings: Listing[];
  onToggleSave: (listing: Listing) => void;
}

// Default NYC map center (Manhattan / East River area)
const NYC_CENTER = { lat: 40.73061, lng: -73.935242 };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  listings,
  onOpenIntelModal,
  savedListings,
  onToggleSave,
}) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const mapsApiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

  // Fallback map projection helper for vector radar when Google Maps key is loading
  const getMapCoords = (lat: number, lng: number) => {
    const minLat = 40.69;
    const maxLat = 40.79;
    const minLng = -74.02;
    const maxLng = -73.90;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative w-full h-[650px] bg-neutral-950 border border-white/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col justify-between">
        {/* Map Header Overlay Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
          <div>
            <h2 className="text-base font-black font-mono text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400 animate-pulse" />
              GOTHAM REAL-TIME GOOGLE MAPS RADAR
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Live Google Maps view across Manhattan, Brooklyn & Queens with active property pins
            </p>
          </div>

          {/* Subway line key pills */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">ACE</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black font-extrabold">NQRW</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">456</span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-600 text-white font-bold">L</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">BDFM</span>
          </div>
        </div>

        {/* Real Google Maps Container */}
        {mapsApiKey ? (
          <APIProvider apiKey={mapsApiKey}>
            <div className="w-full h-full">
              <Map
                defaultCenter={NYC_CENTER}
                defaultZoom={12}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                mapId={'gotham_dark_map'}
                className="w-full h-full"
              >
                {listings.map((listing) => {
                  const isSelected = selectedListing?.id === listing.id;

                  return (
                    <Marker
                      key={listing.id}
                      position={{ lat: listing.lat, lng: listing.lng }}
                      title={`${listing.title} - $${listing.price}/mo`}
                      onClick={() => setSelectedListing(listing)}
                    />
                  );
                })}

                {/* Selected Pin InfoWindow popup */}
                {selectedListing && (
                  <InfoWindow
                    position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
                    onCloseClick={() => setSelectedListing(null)}
                  >
                    <div className="p-2 max-w-xs text-neutral-900 font-sans space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase">
                            {selectedListing.neighborhood} • {selectedListing.borough}
                          </span>
                          <h4 className="text-xs font-bold text-neutral-900 mt-1 line-clamp-1">
                            {selectedListing.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={selectedListing.imageUrl}
                          alt={selectedListing.title}
                          className="w-16 h-12 object-cover rounded border border-neutral-200"
                        />
                        <div className="space-y-0.5">
                          <div className="text-sm font-black font-mono text-emerald-700">
                            ${selectedListing.price}/mo
                          </div>
                          <div className="text-[11px] text-neutral-600 font-mono">
                            {selectedListing.beds} Bed • {selectedListing.baths} Bath
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onOpenIntelModal(selectedListing);
                          setSelectedListing(null);
                        }}
                        className="w-full mt-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Neighborhood Intel</span>
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </APIProvider>
        ) : (
          /* Fallback Custom Interactive Vector Map when API key is loading */
          <div className="relative w-full h-full bg-neutral-950 p-6 flex flex-col justify-between">
            {/* Ambient Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />

            {/* SVG NYC Map Base Graphic */}
            <div className="absolute inset-0 z-0">
              <svg className="w-full h-full opacity-60">
                <path
                  d="M 15% 0 Q 30% 40% 10% 100%"
                  stroke="#1e3a8a"
                  strokeWidth="40"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M 45% 0 Q 50% 50% 80% 100%"
                  stroke="#1e3a8a"
                  strokeWidth="35"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M 20% 10% L 35% 50% L 38% 85%"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                />
                <path
                  d="M 30% 15% L 42% 45% L 75% 70%"
                  stroke="#eab308"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                />
                <path
                  d="M 35% 50% L 85% 52%"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                />
              </svg>

              <div className="absolute top-[20%] left-[25%] font-mono text-xs font-extrabold text-blue-400/40 tracking-widest pointer-events-none uppercase">
                MANHATTAN
              </div>
              <div className="absolute top-[65%] left-[65%] font-mono text-xs font-extrabold text-purple-400/40 tracking-widest pointer-events-none uppercase">
                BROOKLYN
              </div>
              <div className="absolute top-[25%] left-[70%] font-mono text-xs font-extrabold text-emerald-400/40 tracking-widest pointer-events-none uppercase">
                QUEENS
              </div>
            </div>

            {/* Interactive Pins Layer */}
            <div className="relative z-10 w-full h-full pt-16">
              {listings.map((listing) => {
                const { x, y } = getMapCoords(listing.lat, listing.lng);
                const isSelected = selectedListing?.id === listing.id;

                return (
                  <div
                    key={listing.id}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <div className="relative">
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-500 opacity-50"></span>
                      <button
                        className={`relative px-3 py-1.5 rounded-full font-mono font-bold text-xs shadow-2xl transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-400 text-black border-white scale-110 z-30 ring-4 ring-emerald-400/40'
                            : 'bg-neutral-900/90 text-white border-emerald-500/60 hover:scale-105'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        <span>${listing.price}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Pin Popup Card Box in Fallback Mode */}
            {selectedListing && (
              <div className="absolute bottom-6 left-6 z-30 bg-black/90 backdrop-blur-xl border border-emerald-500/50 shadow-2xl rounded-2xl p-4 max-w-sm w-full animate-fadeIn flex flex-col justify-between text-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      {selectedListing.neighborhood} • {selectedListing.borough}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
                      {selectedListing.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <img
                    src={selectedListing.imageUrl}
                    alt={selectedListing.title}
                    className="w-20 h-16 object-cover rounded-xl border border-white/10"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="text-lg font-black font-mono text-emerald-400">
                      ${selectedListing.price}/mo
                    </div>
                    <div className="text-neutral-300 font-mono flex items-center gap-2">
                      <span>{selectedListing.beds} Bed</span>
                      <span>•</span>
                      <span>{selectedListing.baths} Bath</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onOpenIntelModal(selectedListing);
                    setSelectedListing(null);
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inspect Neighborhood Intel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
