import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Conversation, DirectMessage } from '../../types';

export const HostMessages: React.FC = () => {
  const { authHeaders, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('c'));
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
    fetch('/api/messages', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [authHeaders]);

  const loadThread = useCallback(
    (id: string) => {
      fetch(`/api/messages/${id}`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => {
          setActiveConversation(data.conversation);
          setMessages(data.messages || []);
        })
        .catch(console.error);
    },
    [authHeaders]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const fromQuery = searchParams.get('c');
    if (fromQuery) setActiveId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSearchParams({ c: id });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ conversationId: activeId, text: draft.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setDraft('');
        loadConversations();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">
          Dual-pane chat tied to listings and inquiries.
        </p>
      </div>

      <div className="h-[calc(100vh-12rem)] min-h-[420px] rounded-2xl border border-slate-200 bg-white overflow-hidden flex">
        {/* Conversations list */}
        <div className="w-full max-w-[280px] border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No threads yet</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left p-3 border-b border-slate-100 transition-all ${
                    activeId === c.id ? 'bg-teal-50' : 'hover:bg-white'
                  }`}
                >
                  <p className="text-xs font-bold truncate text-slate-800">
                    {user?.role === 'host' ? c.seekerName : c.hostName}
                  </p>
                  <p className="text-[10px] text-teal-700 truncate mt-0.5">
                    {c.listingTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-1">{c.lastMessagePreview}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeId || !activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-slate-200">
                <p className="text-sm font-bold text-slate-800">
                  {user?.role === 'host'
                    ? activeConversation.seekerName
                    : activeConversation.hostName}
                </p>
                <p className="text-[10px] text-slate-500">
                  Re: {activeConversation.listingTitle}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-[10px] opacity-70 mb-0.5">{m.senderName}</p>
                        <p>{m.text}</p>
                        <p className="text-[9px] opacity-50 mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
