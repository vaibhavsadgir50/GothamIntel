import React, { useState } from 'react';
import { Bookmark, Sparkles, Train, Shield, Radio, MapPin, User as UserIcon, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  savedListings: Listing[];
  onOpenSavedDrawer: () => void;
  onSelectViewMode: (mode: 'grid' | 'map') => void;
  viewMode: 'grid' | 'map';
  activeListingsCount: number;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
}

export const Header: React.FC<HeaderProps> = ({
  savedListings,
  onOpenSavedDrawer,
  onSelectViewMode,
  viewMode,
  activeListingsCount,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-black/40 backdrop-blur-md border-b border-white/10 shadow-2xl">
      {/* MTA Live Ticker Bar */}
      <div className="bg-black/60 border-b border-white/5 px-4 py-1.5 text-xs text-neutral-300 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-3 animate-pulse shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px] uppercase">
            <Radio className="w-3 h-3 text-emerald-400" />
            VIBE_ANALYZER: ONLINE
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-neutral-400">
            SYSTEM STATUS: 24/7 MULTIMODAL GEMINI SCANNER ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar font-mono text-[11px] whitespace-nowrap text-neutral-300">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">A</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">C</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">E</span>
            <span className="text-emerald-400 font-bold">NORMAL</span>
          </span>
          <span className="text-neutral-600">•</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-bold text-black">N</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex items-center justify-center text-[8px] font-bold text-black">W</span>
            <span className="text-emerald-400 font-bold">GOOD SERVICE</span>
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-black font-black text-xl select-none">
            G
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tighter uppercase italic text-white font-sans">
                GOTHAM<span className="text-emerald-400">INTEL</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                NYC 2026
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono hidden sm:block">
              Multimodal AI Real Estate & Sassy Neighborhood Intelligence
            </p>
          </div>
        </div>

        {/* View Toggle & Saved Drawer CTA */}
        <div className="flex items-center gap-2.5">
          {/* Active Results Counter */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeListingsCount} LISTINGS</span>
          </div>

          {/* Grid vs Map View Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onSelectViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => onSelectViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map Radar</span>
            </button>
          </div>

          {/* Bookmarked / Saved Listings Button */}
          <button
            onClick={onOpenSavedDrawer}
            className="relative px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-400/50 text-white text-xs font-semibold flex items-center gap-2 transition-all group"
          >
            <Bookmark className="w-4 h-4 text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Saved</span>
            {savedListings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-neutral-950 text-[10px] font-extrabold font-mono">
                {savedListings.length}
              </span>
            )}
          </button>

          {/* User Auth Control */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-bold transition-all"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-emerald-400/50 bg-neutral-800"
                />
                <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* User Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                  <div className="p-2.5 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] font-mono text-emerald-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSavedDrawer();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My Shortlist ({user.savedListingIds.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>

              <button
                onClick={() => onOpenAuthModal('signup')}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
