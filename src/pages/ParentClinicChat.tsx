
import { useState, useEffect, useRef } from 'react';
import { Send, HeartPulse, User, ShieldAlert, Check, CheckCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ShootingStars } from '../components/Effects';
import api from '../services/api';
import { getParentDashboard } from '../services/parentService';

interface Child {
  id: string;
  fullName?: string;
}

interface ChatMessage {
  id: string;
  role: 'clinic' | 'parent';
  child_id?: string;
  text: string;
  timestamp?: string;
  is_read?: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export const ParentClinicChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(searchParams.get('childId'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getParentDashboard();
        const kids = data.children || [];
        setChildren(kids);
        if (kids.length > 0) {
          const urlChildId = searchParams.get('childId');
          const fromUrl = urlChildId ? kids.find(k => k.id === urlChildId) : undefined;
          const initialId = fromUrl?.id ?? kids[0].id;
          setSelectedChildId(initialId);
          if (!urlChildId || !fromUrl) {
            setSearchParams({ childId: initialId }, { replace: true });
          }
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/clinic/chat?childId=${encodeURIComponent(selectedChildId)}`);
        // normalize messages
        const msgs = (res.data?.data || []).map((m: any) => ({
          id: m.id,
          role: m.role || m.sender_role || 'parent',
          child_id: m.child_id || m.student_id || m.childId,
          text: m.text || m.message,
          timestamp: m.timestamp || m.created_at,
          is_read: m.is_read ?? m.read ?? false
        }));
        setMessages(msgs);
        await api.post('/clinic/chat/read', { student_id: selectedChildId });
        window.dispatchEvent(new Event('clinic-notification-update'));
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [selectedChildId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend || !selectedChildId) return;

    // Reset the input field immediately
    setNewMessage('');

    // Add message to state immediately with 'sending' status and a temporary ID
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const tempMsg: ChatMessage = {
      id: tempId,
      role: 'parent',
      child_id: selectedChildId,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post('/clinic/chat', {
        message: textToSend,
        childId: selectedChildId,
        recipientRole: 'clinic-admin'
      });
      const m = res.data?.data || res.data;

      // Update status to 'sent'
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? {
                ...msg,
                id: m.id || msg.id,
                timestamp: m.timestamp || m.created_at || msg.timestamp,
                status: 'sent'
              }
            : msg
        )
      );
      window.dispatchEvent(new Event('clinic-notification-update'));

      // Asynchronously fetch fresh data to sync timestamps/read states
      try {
        const fresh = await api.get(`/clinic/chat?childId=${encodeURIComponent(selectedChildId)}`);
        const msgs = (fresh.data?.data || []).map((mm: any) => ({
          id: mm.id,
          role: mm.role || mm.sender_role || 'parent',
          child_id: mm.child_id || mm.student_id || mm.childId,
          text: mm.text || mm.message,
          timestamp: mm.timestamp || mm.created_at,
          is_read: mm.is_read ?? mm.read ?? false,
          status: 'sent'
        }));
        setMessages(msgs);
      } catch {}
    } catch (err: any) {
      console.error('Send failed:', err);
      // Update status to 'failed'
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? {
                ...msg,
                status: 'failed'
              }
            : msg
        )
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
      <ShootingStars />

      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
            <HeartPulse size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinic Support</h2>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Direct Channel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Child</span>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {loading ? (
                <div className="px-4 py-1.5 text-xs text-slate-400">Loading...</div>
              ) : children.length === 0 ? (
                <div className="px-4 py-1.5 text-xs text-slate-400">No children found</div>
              ) : (
                children.map((child: Child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setSearchParams({ childId: child.id });
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedChildId === child.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {(child.fullName || '').split(' ')[0] || 'Child'}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
           <ShieldAlert size={14} className="text-amber-500" />
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Private & Encrypted</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
        {messages.filter(m => m.child_id === selectedChildId).map((m) => (
          <div key={m.id} className={`flex items-start gap-3 ${m.role === 'parent' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
              m.role === 'parent' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {m.role === 'parent' ? <User size={14} /> : <HeartPulse size={14} />}
            </div>
            <div className={`max-w-[75%] space-y-1 ${m.role === 'parent' ? 'text-right' : ''}`}>
              <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                m.role === 'parent'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}>
                {m.text}
              </div>
              <div className="flex items-center gap-2 justify-end px-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase">{m.timestamp || 'Just now'}</span>
                {m.role === 'parent' && (
                  m.status === 'sending' ? (
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" title="Sending..." />
                  ) : m.status === 'failed' ? (
                    <span className="flex items-center gap-1 text-rose-500 font-black text-[9px] uppercase" title="Failed to send">
                      <ShieldAlert size={12} />
                      Not Sent
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Sent" />
                      {m.is_read ? (
                        <CheckCheck size={12} className="text-emerald-450" />
                      ) : (
                        <Check size={12} className="text-slate-400" />
                      )}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 z-10">
        <form onSubmit={handleSend} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tell the clinic admin something important..."
            className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedChildId || loading}
            title={!newMessage.trim() ? 'Enter a message to enable sending' : !selectedChildId ? 'Select a child first' : 'Send message to clinic admin'}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all group ${(!newMessage.trim() || !selectedChildId || loading) ? 'bg-rose-300 text-white cursor-not-allowed shadow-none' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200'}`}
          >
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span className="hidden sm:inline">Send Message</span>
          </button>
        </form>
      </div>
    </div>
  );
};
