import React from 'react';
import { Layers, Search, MapPin, Heart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  activeTab: 'swipe' | 'search' | 'map' | 'saved' | 'profile';
  setActiveTab: (tab: 'swipe' | 'search' | 'map' | 'saved' | 'profile') => void;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
}) => {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around font-mono text-[10px]">
        
        {/* Swipe Tab */}
        <button
          onClick={() => setActiveTab('swipe')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl ${
            activeTab === 'swipe'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'swipe' ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <Layers className="w-5 h-5" />
          </div>
          <span>SWIPE</span>
        </button>

        {/* Vibe Search Tab */}
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl ${
            activeTab === 'search'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'search' ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <Search className="w-5 h-5" />
          </div>
          <span>VIBE SEARCH</span>
        </button>

        {/* Google Map Tab */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl ${
            activeTab === 'map'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'map' ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <MapPin className="w-5 h-5" />
          </div>
          <span>MAP RADAR</span>
        </button>

        {/* Saved Shortlist Tab */}
        <button
          onClick={() => setActiveTab('saved')}
          className={`relative flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl ${
            activeTab === 'saved'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full relative ${activeTab === 'saved' ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <Heart className={`w-5 h-5 ${savedCount > 0 ? 'fill-emerald-400/30' : ''}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </div>
          <span>SHORTLIST</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl ${
            activeTab === 'profile'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'profile' ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            {user ? (
              <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full border border-emerald-400" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <span>{user ? 'PROFILE' : 'AUTH'}</span>
        </button>

      </div>
    </nav>
  );
};
