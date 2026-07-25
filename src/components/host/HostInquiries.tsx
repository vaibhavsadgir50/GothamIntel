import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageSquare, Building2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Inquiry, InquiryStatus } from '../../types';

const statusStyles: Record<InquiryStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-teal-50 text-teal-700 border-teal-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const HostInquiries: React.FC = () => {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/host/inquiries', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setInquiries(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    const res = await fetch(`/api/host/inquiries/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
  };

  const openMessage = async (inquiry: Inquiry) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        inquiryId: inquiry.id,
        text: `Hi ${inquiry.seekerName} — thanks for your interest in ${inquiry.listingTitle}. Happy to chat!`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      navigate(`/host/messages?c=${data.conversation.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">
            Applications on your listings.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 animate-pulse">Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-sm text-slate-600">No inquiries yet</p>
          <p className="text-xs text-slate-500 mt-1">
            When people apply to your listings, they appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <article
              key={inq.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{inq.seekerName}</h3>
                  <p className="text-[11px] text-slate-500">{inq.seekerEmail}</p>
                  {inq.seekerWorkplace && (
                    <p className="text-[11px] text-teal-700 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {inq.seekerWorkplace}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${statusStyles[inq.status]}`}
                >
                  {inq.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{inq.message}</p>
              <p className="text-[10px] text-slate-400">
                Re: {inq.listingTitle} · {new Date(inq.createdAt).toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {inq.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(inq.id, 'accepted')}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(inq.id, 'declined')}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold flex items-center gap-1 hover:bg-rose-100"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </>
                )}
                <button
                  onClick={() => openMessage(inq)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
