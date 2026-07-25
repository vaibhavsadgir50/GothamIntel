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

  const item = (id: typeof activeTab, label: string, icon: React.ReactNode) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center gap-0.5 transition-all py-1 px-2 rounded-xl ${
          active ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className={`p-1.5 rounded-xl relative ${active ? 'bg-teal-50' : ''}`}>
          {icon}
          {id === 'saved' && savedCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-md bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {item('swipe', 'Swipe', <Layers className="w-5 h-5" />)}
        {item('search', 'Search', <Search className="w-5 h-5" />)}
        {item('map', 'Map', <MapPin className="w-5 h-5" />)}
        {item(
          'saved',
          'Saved',
          <Heart className={`w-5 h-5 ${savedCount > 0 ? 'fill-teal-600/20' : ''}`} />
        )}
        {item(
          'profile',
          user ? 'You' : 'Account',
          user ? (
            <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )
        )}
      </div>
    </nav>
  );
};
