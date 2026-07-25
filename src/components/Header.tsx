import React, { useState } from 'react';
import { Bookmark, Sparkles, MapPin, User as UserIcon, LogOut, LogIn, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="bg-teal-50/80 border-b border-teal-100 px-4 py-1.5 text-xs text-slate-600 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white text-teal-700 border border-teal-100 font-semibold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Live NYC listings
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-500">
            Friendly neighborhood intel for your next place
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 whitespace-nowrap">
          <span className="hidden sm:inline">{activeListingsCount} homes ready</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-teal-600 text-white font-display font-bold text-lg select-none">
            G
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-slate-800">
              Gotham<span className="text-teal-600">Intel</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Find a cozy NYC sublet — or host yours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onSelectViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => onSelectViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>

          <button
            onClick={onOpenSavedDrawer}
            className="relative px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Bookmark className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Saved</span>
            {savedListings.length > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-lg bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {savedListings.length}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full bg-slate-100"
                />
                <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 z-50 animate-fadeIn space-y-1">
                  <div className="p-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-teal-700 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSavedDrawer();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                    <span>My shortlist ({user.savedListingIds.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 hover:border-teal-300"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
