import React, { useEffect, useState } from 'react';
import { Eye, Inbox, Percent, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HostStats } from '../../types';

export const HostStatsPage: React.FC = () => {
  const { authHeaders } = useAuth();
  const [stats, setStats] = useState<HostStats | null>(null);

  useEffect(() => {
    fetch('/api/host/stats', { headers: authHeaders() })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [authHeaders]);

  if (!stats) {
    return <p className="text-xs text-slate-500 animate-pulse">Loading analytics...</p>;
  }

  const cards = [
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-sky-600' },
    { label: 'Active Inquiries', value: stats.activeInquiries, icon: Inbox, color: 'text-amber-600' },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: Percent,
      color: 'text-teal-700',
      sub: `${stats.totalInquiries} inquiries / ${stats.totalViews} views`,
    },
    { label: 'Accepted', value: stats.acceptedCount, icon: CheckCircle2, color: 'text-teal-700' },
    { label: 'Declined', value: stats.declinedCount, icon: XCircle, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Stats & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Performance across your host listings.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2 text-slate-800">
            <Building2 className="w-4 h-4 text-teal-600" />
            Top Workplaces Among Seekers
          </h3>
          {stats.topWorkplaces.length === 0 ? (
            <p className="text-xs text-slate-500">No workplace data yet from inquiries.</p>
          ) : (
            <div className="space-y-3">
              {stats.topWorkplaces.map((c) => {
                const max = stats.topWorkplaces[0]?.count || 1;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.workplace} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{c.workplace}</span>
                      <span className="text-teal-700 font-semibold">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="font-display font-bold text-sm mb-4 text-slate-800">Views by Neighborhood</h3>
          {Object.keys(stats.neighborhoodViews).length === 0 ? (
            <p className="text-xs text-slate-500">No view data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.neighborhoodViews)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .map(([hood, views]) => (
                  <div key={hood} className="flex justify-between text-xs">
                    <span className="text-slate-600">{hood}</span>
                    <span className="text-sky-600 font-semibold">{views} views</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
