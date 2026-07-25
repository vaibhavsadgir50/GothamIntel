import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Inbox, Percent, Home, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HostStats } from '../../types';

export const HostDashboard: React.FC = () => {
  const { authHeaders, user } = useAuth();
  const [stats, setStats] = useState<HostStats | null>(null);

  useEffect(() => {
    fetch('/api/host/stats', { headers: authHeaders() })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [authHeaders]);

  const cards = [
    { label: 'Total Views', value: stats?.totalViews ?? '—', icon: Eye, color: 'text-sky-600' },
    { label: 'Active Inquiries', value: stats?.activeInquiries ?? '—', icon: Inbox, color: 'text-amber-600' },
    { label: 'Conversion', value: stats ? `${stats.conversionRate}%` : '—', icon: Percent, color: 'text-teal-700' },
    { label: 'Active Listings', value: stats?.activeListings ?? '—', icon: Home, color: 'text-teal-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage sublets, inquiries, and messaging from your host portal.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Link
          to="/host/listings/new"
          className="p-5 rounded-2xl bg-teal-50 border border-teal-200 hover:bg-teal-100/80 transition-all group"
        >
          <Home className="w-6 h-6 text-teal-700 mb-3" />
          <h3 className="font-display font-bold text-sm text-slate-800">Post a Sublet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">List a new furnished unit for renters.</p>
          <span className="text-teal-700 text-xs font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Create listing <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
        <Link
          to="/host/inquiries"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all group"
        >
          <Inbox className="w-6 h-6 text-amber-600 mb-3" />
          <h3 className="font-display font-bold text-sm text-slate-800">Review Inquiries</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            {stats?.activeInquiries ?? 0} pending applications waiting.
          </p>
          <span className="text-amber-600 text-xs font-semibold inline-flex items-center gap-1">
            Open inbox <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
        <Link
          to="/host/messages"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all group"
        >
          <MessageSquare className="w-6 h-6 text-sky-600 mb-3" />
          <h3 className="font-display font-bold text-sm text-slate-800">Messages</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Chat with interested renters.</p>
          <span className="text-sky-600 text-xs font-semibold inline-flex items-center gap-1">
            Open chat <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {stats && stats.topWorkplaces.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="font-display font-bold text-sm text-slate-800 mb-3">Where seekers work</h3>
          <div className="space-y-2">
            {stats.topWorkplaces.map((c) => (
              <div key={c.workplace} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{c.workplace}</span>
                <span className="text-teal-700 font-semibold">{c.count} inquiries</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
