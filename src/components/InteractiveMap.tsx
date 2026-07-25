import React, { useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Sparkles, X } from 'lucide-react';
import { Listing } from '../types';

interface InteractiveMapProps {
  listings: Listing[];
  onOpenIntelModal: (listing: Listing) => void;
  savedListings: Listing[];
  onToggleSave: (listing: Listing) => void;
}

const NYC_CENTER = { lat: 40.73061, lng: -73.935242 };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  listings,
  onOpenIntelModal,
  savedListings,
  onToggleSave,
}) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const mapsApiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

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
      <div className="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              NYC map explorer
            </h2>
            <p className="text-xs text-slate-500">
              Live map view across Manhattan, Brooklyn & Queens with property pins
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">ACE</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 font-extrabold">NQRW</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">456</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-500 text-white font-bold">L</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">BDFM</span>
          </div>
        </div>

        {mapsApiKey ? (
          <APIProvider apiKey={mapsApiKey}>
            <div className="w-full h-full">
              <Map
                defaultCenter={NYC_CENTER}
                defaultZoom={12}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                mapId={'gotham_light_map'}
                className="w-full h-full"
              >
                {listings.map((listing) => {
                  return (
                    <Marker
                      key={listing.id}
                      position={{ lat: listing.lat, lng: listing.lng }}
                      title={`${listing.title} - $${listing.price}/mo`}
                      onClick={() => setSelectedListing(listing)}
                    />
                  );
                })}

                {selectedListing && (
                  <InfoWindow
                    position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
                    onCloseClick={() => setSelectedListing(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-800 font-sans space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-semibold uppercase border border-teal-200">
                            {selectedListing.neighborhood} • {selectedListing.borough}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                            {selectedListing.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={selectedListing.imageUrl}
                          alt={selectedListing.title}
                          className="w-16 h-12 object-cover rounded border border-slate-200"
                        />
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-teal-700">
                            ${selectedListing.price}/mo
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {selectedListing.beds} Bed • {selectedListing.baths} Bath
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onOpenIntelModal(selectedListing);
                          setSelectedListing(null);
                        }}
                        className="w-full mt-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Neighborhood Intel</span>
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </APIProvider>
        ) : (
          <div className="relative w-full h-full bg-slate-50 p-6 flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

            <div className="absolute inset-0 z-0">
              <svg className="w-full h-full opacity-50">
                <path
                  d="M 15% 0 Q 30% 40% 10% 100%"
                  stroke="#bae6fd"
                  strokeWidth="40"
                  fill="none"
                  opacity="0.5"
                />
                <path
                  d="M 45% 0 Q 50% 50% 80% 100%"
                  stroke="#99f6e4"
                  strokeWidth="35"
                  fill="none"
                  opacity="0.5"
                />
                <path
                  d="M 20% 10% L 35% 50% L 38% 85%"
                  stroke="#0d9488"
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
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                />
              </svg>

              <div className="absolute top-[20%] left-[25%] text-xs font-bold text-sky-400/50 tracking-widest pointer-events-none uppercase">
                Manhattan
              </div>
              <div className="absolute top-[65%] left-[65%] text-xs font-bold text-teal-400/50 tracking-widest pointer-events-none uppercase">
                Brooklyn
              </div>
              <div className="absolute top-[25%] left-[70%] text-xs font-bold text-cyan-400/50 tracking-widest pointer-events-none uppercase">
                Queens
              </div>
            </div>

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
                      <button
                        className={`relative px-3 py-1.5 rounded-full font-semibold text-xs transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 scale-110 z-30 ring-2 ring-teal-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:scale-105'
                        }`}
                      >
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-teal-600'}`} />
                        <span>${listing.price}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedListing && (
              <div className="absolute bottom-6 left-6 z-30 bg-white border border-slate-200 shadow-lg rounded-2xl p-4 max-w-sm w-full animate-fadeIn flex flex-col justify-between text-slate-800">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                      {selectedListing.neighborhood} • {selectedListing.borough}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                      {selectedListing.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <img
                    src={selectedListing.imageUrl}
                    alt={selectedListing.title}
                    className="w-20 h-16 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="text-lg font-bold font-display text-teal-700">
                      ${selectedListing.price}/mo
                    </div>
                    <div className="text-slate-500 flex items-center gap-2">
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
                  className="w-full mt-2 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View neighborhood intel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
