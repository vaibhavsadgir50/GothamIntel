import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { SwipeDeck } from './components/SwipeDeck';
import { ListingDetailModal } from './components/ListingDetailModal';
import { VibeSearchBar } from './components/VibeSearchBar';
import { ListingCard } from './components/ListingCard';
import { InteractiveMap } from './components/InteractiveMap';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HostLayout } from './components/host/HostLayout';
import { HostDashboard } from './components/host/HostDashboard';
import { HostListings, PostListingForm } from './components/host/HostListings';
import { HostInquiries } from './components/host/HostInquiries';
import { HostStatsPage } from './components/host/HostStats';
import { HostMessages } from './components/host/HostMessages';
import { RequireRole, RoleHomeRedirect } from './components/RequireRole';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Listing, FilterState, VibeSearchResponse, UserRole } from './types';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Bookmark,
  LogIn,
  User as UserIcon,
  LogOut,
  Heart,
  Building2,
} from 'lucide-react';

function DiscoverApp() {
  const { user, toggleSaveListing, isSaved, logout } = useAuth();
  const navigate = useNavigate();

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [vibeResult, setVibeResult] = useState<VibeSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const [guestSavedListings, setGuestSavedListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem('gotham_saved_listings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDetailListing, setSelectedDetailListing] = useState<Listing | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Hosts should live in the host portal
  useEffect(() => {
    if (user?.role === 'host') {
      navigate('/host/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const savedListings: Listing[] = user
    ? allListings.filter((l) => user.savedListingIds.includes(l.id))
    : guestSavedListings;

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('gotham_saved_listings', JSON.stringify(guestSavedListings));
      } catch (e) {
        console.error('Failed to save guest listings to localStorage:', e);
      }
    }
  }, [guestSavedListings, user]);

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
        if (exists) return prev.filter((l) => l.id !== listing.id);
        return [...prev, listing];
      });
    }
  };

  const handleInterestDecision = (listing: Listing, interested: boolean) => {
    if (interested) {
      if (user) {
        if (!user.savedListingIds.includes(listing.id)) toggleSaveListing(listing.id);
      } else if (!guestSavedListings.some((l) => l.id === listing.id)) {
        setGuestSavedListings((prev) => [...prev, listing]);
      }
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'host') navigate('/host/dashboard');
    else navigate('/discover');
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900 flex flex-col justify-between pb-16">
      <div className="flex-1 flex flex-col">
        <Header
          savedListings={savedListings}
          onOpenSavedDrawer={() => setMobileTab('saved')}
          onSelectViewMode={(mode) => setMobileTab(mode === 'map' ? 'map' : 'search')}
          viewMode={mobileTab === 'map' ? 'map' : 'grid'}
          activeListingsCount={displayedListings.length}
          onOpenAuthModal={handleOpenAuth}
        />

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 my-20">
            <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-sm text-slate-500">
              Loading listings…
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-white border border-rose-200 text-rose-700 text-center space-y-3 m-6 shadow-sm">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {mobileTab === 'swipe' && (
              <SwipeDeck
                listings={displayedListings}
                onOpenDetail={(listing) => setSelectedDetailListing(listing)}
                onInterest={handleInterestDecision}
                savedListingIds={savedListings.map((l) => l.id)}
              />
            )}

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
                    <div className="py-16 p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3 max-w-sm mx-auto my-6">
                      <Sparkles className="w-10 h-10 text-teal-600 mx-auto" />
                      <h3 className="text-base font-bold font-display text-slate-800">No listings found</h3>
                      <p className="text-sm text-slate-500">
                        Try clearing or resetting filters to show all Manhattan, Brooklyn & Queens
                        properties.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm"
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

            {mobileTab === 'saved' && (
              <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600 fill-teal-100" />
                    My shortlist
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                    {savedListings.length} Saved
                  </span>
                </div>

                {savedListings.length === 0 ? (
                  <div className="py-16 text-center space-y-4 bg-white rounded-2xl p-6 border border-slate-200">
                    <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold font-display text-slate-800">
                      Your shortlist is empty
                    </h3>
                    <p className="text-sm text-slate-500">
                      Swipe right or tap interested on properties to add them to your saved
                      shortlist!
                    </p>
                    <button
                      onClick={() => setMobileTab('swipe')}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm"
                    >
                      Start swiping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedListings.map((listing) => (
                      <div
                        key={listing.id}
                        onClick={() => setSelectedDetailListing(listing)}
                        className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-teal-700 font-bold text-sm">
                              ${listing.price}/mo
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">
                              {listing.neighborhood}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-700">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>
                              {listing.beds} Bed • {listing.baths} Bath
                            </span>
                            <span>•</span>
                            <span className="text-amber-600">★ {listing.aiRating}/10</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(listing);
                          }}
                          className="p-2 text-rose-500 hover:text-rose-600 transition-all"
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

            {mobileTab === 'profile' && (
              <div className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
                {user ? (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 text-center">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-20 h-20 rounded-full mx-auto border-2 border-teal-200 bg-slate-50"
                    />
                    <div>
                      <h2 className="text-lg font-bold font-display text-slate-800">{user.name}</h2>
                      <p className="text-sm text-teal-700">{user.email}</p>
                      <p className="mt-2 inline-flex px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[10px] font-semibold uppercase text-teal-700">
                        {user.role}
                      </p>
                      {user.companyName && (
                        <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.companyName}
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-sm text-slate-500 mt-2">{user.bio}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2">
                        Gotham member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Shortlist</span>
                        <p className="text-base font-bold text-teal-700">
                          {user.savedListingIds.length} Saved
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Role</span>
                        <p className="text-base font-bold text-teal-700 capitalize">{user.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => logout()}
                      className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
                      <UserIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold font-display text-slate-800">Your Gotham account</h2>
                      <p className="text-sm text-slate-500">
                        Sign in to discover sublets, or create a host account to list your place.
                      </p>
                    </div>
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => handleOpenAuth('login')}
                        className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Log in</span>
                      </button>
                      <button
                        onClick={() => handleOpenAuth('signup')}
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Create account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
        onRequestAuth={() => handleOpenAuth('login')}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <MobileBottomNav
        activeTab={mobileTab}
        setActiveTab={setMobileTab}
        savedCount={savedListings.length}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="/discover" element={<DiscoverApp />} />
      <Route path="/dashboard" element={<Navigate to="/discover" replace />} />

      <Route
        path="/host"
        element={
          <RequireRole role="host">
            <HostLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HostDashboard />} />
        <Route path="listings" element={<HostListings />} />
        <Route path="listings/new" element={<PostListingForm />} />
        <Route path="inquiries" element={<HostInquiries />} />
        <Route path="stats" element={<HostStatsPage />} />
        <Route path="messages" element={<HostMessages />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
