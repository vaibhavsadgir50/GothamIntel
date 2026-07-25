import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { SwipeDeck } from './components/SwipeDeck';
import { ListingDetailModal } from './components/ListingDetailModal';
import { VibeSearchBar } from './components/VibeSearchBar';
import { ListingCard } from './components/ListingCard';
import { InteractiveMap } from './components/InteractiveMap';
import { SavedListingsDrawer } from './components/SavedListingsDrawer';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Listing, FilterState, VibeSearchResponse } from './types';
import { Sparkles, RefreshCw, AlertCircle, Bookmark, LogIn, User as UserIcon, LogOut, Heart, MapPin, Train } from 'lucide-react';

function GothamAppContent() {
  const { user, toggleSaveListing, isSaved, logout } = useAuth();

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [vibeResult, setVibeResult] = useState<VibeSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Mobile View Tab: 'swipe' | 'search' | 'map' | 'saved' | 'profile'
  const [mobileTab, setMobileTab] = useState<'swipe' | 'search' | 'map' | 'saved' | 'profile'>('swipe');

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    borough: 'all',
    maxPrice: 10000,
    minBeds: 0,
    selectedVibe: '',
    imagePreview: null,
    audioRecorded: false,
  });

  // Guest fallback saved listings state
  const [guestSavedListings, setGuestSavedListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem('gotham_saved_listings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Detail View Modal Listing
  const [selectedDetailListing, setSelectedDetailListing] = useState<Listing | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);

  // Auth modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Calculate active saved listings based on user profile or guest state
  const savedListings: Listing[] = user
    ? allListings.filter((l) => user.savedListingIds.includes(l.id))
    : guestSavedListings;

  // Sync guest saved listings to LocalStorage
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('gotham_saved_listings', JSON.stringify(guestSavedListings));
      } catch (e) {
        console.error('Failed to save guest listings to localStorage:', e);
      }
    }
  }, [guestSavedListings, user]);

  // Initial fetch of seed listings from backend API
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/listings')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load listings');
        return res.json();
      })
      .then((data: Listing[]) => {
        setAllListings(data);
        setDisplayedListings(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading listings:', err);
        setError('Failed to connect to GothamIntel server API');
        setIsLoading(false);
      });
  }, []);

  // Execute Multimodal Vibe Search
  const handleExecuteVibeSearch = async (customPayload?: any) => {
    setIsSearching(true);
    try {
      const body = {
        query: customPayload?.query ?? filterState.searchQuery,
        imageData: customPayload?.imageData ?? filterState.imagePreview ?? '',
        audioData: customPayload?.audioData ?? '',
        borough: filterState.borough,
        maxPrice: filterState.maxPrice,
      };

      const res = await fetch('/api/vibe-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Vibe search API error');
      const data: VibeSearchResponse = await res.json();

      setVibeResult(data);

      if (data.filteredIds && data.filteredIds.length > 0) {
        const idMap = new Map(allListings.map((l) => [l.id, l]));
        const reordered = data.filteredIds
          .map((id) => idMap.get(id))
          .filter((l): l is Listing => l !== undefined);

        setDisplayedListings(reordered);
      } else {
        setDisplayedListings([]);
      }
    } catch (err) {
      console.error('Error executing vibe search:', err);
      let filtered = [...allListings];
      if (filterState.borough !== 'all') {
        filtered = filtered.filter(
          (l) => l.borough.toLowerCase() === filterState.borough.toLowerCase()
        );
      }
      filtered = filtered.filter((l) => l.price <= filterState.maxPrice);
      setDisplayedListings(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      borough: 'all',
      maxPrice: 10000,
      minBeds: 0,
      selectedVibe: '',
      imagePreview: null,
      audioRecorded: false,
    });
    setVibeResult(null);
    setDisplayedListings(allListings);
  };

  const handleToggleSave = (listing: Listing) => {
    if (user) {
      toggleSaveListing(listing.id);
    } else {
      setGuestSavedListings((prev) => {
        const exists = prev.some((l) => l.id === listing.id);
        if (exists) {
          return prev.filter((l) => l.id !== listing.id);
        } else {
          return [...prev, listing];
        }
      });
    }
  };

  // Handle Swipe decision (Right = Interested/Save, Left = Pass)
  const handleInterestDecision = (listing: Listing, interested: boolean) => {
    if (interested) {
      if (user) {
        if (!user.savedListingIds.includes(listing.id)) {
          toggleSaveListing(listing.id);
        }
      } else {
        if (!guestSavedListings.some((l) => l.id === listing.id)) {
          setGuestSavedListings((prev) => [...prev, listing]);
        }
      }
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500 selection:text-black flex flex-col justify-between pb-16">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/15 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Compact Mobile Header */}
        <Header
          savedListings={savedListings}
          onOpenSavedDrawer={() => setMobileTab('saved')}
          onSelectViewMode={(mode) => setMobileTab(mode === 'map' ? 'map' : 'search')}
          viewMode={mobileTab === 'map' ? 'map' : 'grid'}
          activeListingsCount={displayedListings.length}
          onOpenAuthModal={handleOpenAuth}
        />

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 my-20">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="font-mono text-xs text-neutral-300 animate-pulse uppercase tracking-wider">
              LOADING GOTHAM REAL-TIME MOBILE SCANNER...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-center space-y-3 m-6">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="font-mono text-xs font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          /* TAB RENDER SWITCH */
          <div className="flex-1 flex flex-col">
            
            {/* 1. SWIPE TAB (PRIMARY EXPERIENCE) */}
            {mobileTab === 'swipe' && (
              <SwipeDeck
                listings={displayedListings}
                onOpenDetail={(listing) => setSelectedDetailListing(listing)}
                onInterest={handleInterestDecision}
                savedListingIds={savedListings.map((l) => l.id)}
              />
            )}

            {/* 2. VIBE SEARCH TAB */}
            {mobileTab === 'search' && (
              <div className="space-y-4">
                <VibeSearchBar
                  filterState={filterState}
                  setFilterState={setFilterState}
                  onExecuteVibeSearch={handleExecuteVibeSearch}
                  vibeResult={vibeResult}
                  isSearching={isSearching}
                  onResetFilters={handleResetFilters}
                />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {displayedListings.length === 0 ? (
                    <div className="py-16 p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 max-w-sm mx-auto my-6">
                      <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                      <h3 className="text-base font-bold font-mono text-white">NO LISTINGS FOUND</h3>
                      <p className="text-xs text-neutral-400 font-mono">
                        Try clearing or resetting filters to show all Manhattan, Brooklyn & Queens properties.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-mono font-bold text-xs"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedListings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          isSaved={
                            user
                              ? isSaved(listing.id)
                              : guestSavedListings.some((l) => l.id === listing.id)
                          }
                          onToggleSave={handleToggleSave}
                          onOpenIntelModal={(listing) => setSelectedDetailListing(listing)}
                        />
                      ))}
                    </div>
                  )}
                </main>
              </div>
            )}

            {/* 3. GOOGLE MAP RADAR TAB */}
            {mobileTab === 'map' && (
              <div className="flex-1 flex flex-col">
                <InteractiveMap
                  listings={displayedListings}
                  onOpenIntelModal={(listing) => setSelectedDetailListing(listing)}
                  savedListings={savedListings}
                  onToggleSave={handleToggleSave}
                />
              </div>
            )}

            {/* 4. SHORTLIST / SAVED LISTINGS TAB */}
            {mobileTab === 'saved' && (
              <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h2 className="text-base font-black font-mono text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/30" />
                    MY INTERESTED SHORTLIST
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                    {savedListings.length} Saved
                  </span>
                </div>

                {savedListings.length === 0 ? (
                  <div className="py-16 text-center space-y-4 bg-white/5 rounded-3xl p-6 border border-white/10">
                    <Bookmark className="w-12 h-12 text-neutral-600 mx-auto" />
                    <h3 className="text-sm font-bold font-mono text-neutral-300">YOUR SHORTLIST IS EMPTY</h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      Swipe right or click interested on properties to add them to your Gotham saved shortlist!
                    </p>
                    <button
                      onClick={() => setMobileTab('swipe')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-mono font-extrabold text-xs shadow-lg"
                    >
                      START SWIPING
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedListings.map((listing) => (
                      <div
                        key={listing.id}
                        onClick={() => setSelectedDetailListing(listing)}
                        className="p-3 rounded-2xl bg-neutral-900 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-20 h-20 object-cover rounded-xl border border-white/10 shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-black font-mono text-sm">
                              ${listing.price}/mo
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 uppercase">
                              {listing.neighborhood}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                            {listing.title}
                          </h3>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                            <span>{listing.beds} Bed • {listing.baths} Bath</span>
                            <span>•</span>
                            <span className="text-amber-400">★ {listing.aiRating}/10</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(listing);
                          }}
                          className="p-2 text-rose-400 hover:text-rose-300 transition-all"
                          title="Remove from shortlist"
                        >
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. USER PROFILE / AUTH TAB */}
            {mobileTab === 'profile' && (
              <div className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
                {user ? (
                  <div className="p-6 rounded-3xl bg-neutral-900 border border-white/15 space-y-6 text-center">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-20 h-20 rounded-full mx-auto border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-neutral-800"
                    />

                    <div>
                      <h2 className="text-lg font-bold text-white">{user.name}</h2>
                      <p className="text-xs font-mono text-emerald-400">{user.email}</p>
                      <p className="text-[10px] font-mono text-neutral-500 mt-1">
                        Gotham Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 uppercase">Shortlist</span>
                        <p className="text-base font-bold text-emerald-400">{user.savedListingIds.length} Saved</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 uppercase">AI Security</span>
                        <p className="text-base font-bold text-blue-400">Encrypted</p>
                      </div>
                    </div>

                    <button
                      onClick={() => logout()}
                      className="w-full py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out of Gotham profile</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-neutral-900 border border-white/15 text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <UserIcon className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-lg font-bold font-mono text-white">GOTHAMINTEL ACCOUNT</h2>
                      <p className="text-xs text-neutral-400 font-mono">
                        Sign in or register to sync your saved shortlist across devices.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => handleOpenAuth('login')}
                        className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>LOG IN TO ACCOUNT</span>
                      </button>

                      <button
                        onClick={() => handleOpenAuth('signup')}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>CREATE NEW GOTHAM PROFILE</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Property Detail Modal (Slideshow, Subway icons, AI Rating, Real Gemini Chat) */}
      <ListingDetailModal
        listing={selectedDetailListing}
        onClose={() => setSelectedDetailListing(null)}
        isSaved={
          selectedDetailListing
            ? user
              ? isSaved(selectedDetailListing.id)
              : guestSavedListings.some((l) => l.id === selectedDetailListing.id)
            : false
        }
        onToggleSave={handleToggleSave}
      />

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={mobileTab}
        setActiveTab={setMobileTab}
        savedCount={savedListings.length}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GothamAppContent />
    </AuthProvider>
  );
}
