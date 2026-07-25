import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Inbox,
  BarChart3,
  MessageSquare,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/host/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/host/listings', label: 'Listings', icon: Home },
  { to: '/host/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/host/stats', label: 'Stats', icon: BarChart3 },
  { to: '/host/messages', label: 'Messages', icon: MessageSquare },
];

export const HostLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col md:flex-row">
      <aside className="md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white shrink-0">
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-lg">
            G
          </div>
          <div>
            <p className="font-display font-bold text-sm tracking-tight text-slate-800">
              Gotham<span className="text-teal-700">Host</span>
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Portal</p>
          </div>
        </div>

        <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-teal-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block p-4 mt-auto border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatarUrl}
              alt={user?.name}
              className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-teal-700 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Host
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold flex items-center justify-center gap-2 hover:bg-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
