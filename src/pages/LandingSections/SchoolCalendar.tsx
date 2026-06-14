import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { gregorianToEthiopian, ethiopianToGregorianIso } from '../../utils/ethiopianCalendar';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const ETH_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
];

const EVENT_PILL: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  Academic:         { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300' },
  Meeting:          { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-800/40 dark:text-purple-300' },
  Event:            { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300' },
  Holiday:          { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300' },
  'Summer Break':   { bg: 'bg-rose-50 dark:bg-rose-900/20',   text: 'text-rose-700 dark:text-rose-300',   dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-800/40 dark:text-rose-300' },
  'Semester Break': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-800/40 dark:text-orange-300' },
  'Exam Day':       { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/40 dark:text-indigo-300' },
  'Half Day':       { bg: 'bg-teal-50 dark:bg-teal-900/20',   text: 'text-teal-700 dark:text-teal-300',   dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700 dark:bg-teal-800/40 dark:text-teal-300' },
  Other:            { bg: 'bg-slate-50 dark:bg-slate-800/20',  text: 'text-slate-600 dark:text-slate-400',  dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

const CELL_BG: Record<string, string> = {
  Academic:         'bg-blue-50/60 dark:bg-blue-900/10',
  Meeting:          'bg-purple-50/60 dark:bg-purple-900/10',
  Event:            'bg-emerald-50/60 dark:bg-emerald-900/10',
  Holiday:          'bg-amber-50/60 dark:bg-amber-900/10',
  'Summer Break':   'bg-rose-50/60 dark:bg-rose-900/10',
  'Semester Break': 'bg-orange-50/60 dark:bg-orange-900/10',
  'Exam Day':       'bg-indigo-50/60 dark:bg-indigo-900/10',
  'Half Day':       'bg-teal-50/60 dark:bg-teal-900/10',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInEthMonth(year: number, month: number): number {
  return month === 13 ? (((year + 1) % 4 === 0) ? 6 : 5) : 30;
}

function gregIsoForEthDay(ecY: number, ecM: number, day: number): string | null {
  try { return ethiopianToGregorianIso(`${ecY}-${String(ecM).padStart(2, '0')}-${String(day).padStart(2, '0')}`); }
  catch { return null; }
}

function dowOfEthFirst(ecY: number, ecM: number): number {
  const iso = gregIsoForEthDay(ecY, ecM, 1);
  if (!iso) return 0;
  return new Date(iso + 'T00:00:00').getDay();
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SchoolCalendar = () => {
  const todayEth = gregorianToEthiopian(new Date());
  const [ecYear, setEcYear] = useState(todayEth.year);
  const [ecMonth, setEcMonth] = useState(todayEth.month);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ day: number; events: any[] } | null>(null);

  // Fetch from the public (no-auth) endpoint
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/public/events`);
      setEvents(res.data.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Calendar math
  const totalDays = daysInEthMonth(ecYear, ecMonth);
  const firstDow  = dowOfEthFirst(ecYear, ecMonth);

  const getEventsForDay = (d: number) => {
    const iso = gregIsoForEthDay(ecYear, ecMonth, d);
    if (!iso) return [];
    return events.filter(e => {
      const start = e.date?.slice(0, 10);
      const end   = (e.end_date || e.date)?.slice(0, 10);
      return iso >= start && iso <= end;
    });
  };

  const isToday = (d: number) =>
    ecYear === todayEth.year && ecMonth === todayEth.month && d === todayEth.day;

  // Month events for the sidebar
  const monthEvents = events.filter(e => {
    if (!e.date) return false;
    const firstDay = gregIsoForEthDay(ecYear, ecMonth, 1);
    const lastDay  = gregIsoForEthDay(ecYear, ecMonth, totalDays);
    if (!firstDay || !lastDay) return false;
    const start = e.date.slice(0, 10);
    const end   = (e.end_date || e.date).slice(0, 10);
    return start <= lastDay && end >= firstDay;
  });

  // Upcoming events (from today, next 60 days across all events)
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = [...events]
    .filter(e => e.date && (e.end_date || e.date).slice(0, 10) >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const prevMonth = () => {
    if (ecMonth === 1) { setEcMonth(13); setEcYear(y => y - 1); }
    else setEcMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (ecMonth === 13) { setEcMonth(1); setEcYear(y => y + 1); }
    else setEcMonth(m => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => { setEcYear(todayEth.year); setEcMonth(todayEth.month); setSelectedDay(null); };

  const style = (type: string) => EVENT_PILL[type] ?? EVENT_PILL['Other'];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-100/40 dark:bg-amber-900/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-5">
            <CalendarDays size={13} />
            School Calendar
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Events &amp; Holidays
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Stay up to date with our academic schedule — holidays, exams, family meetings, and special events, displayed in the Ethiopian calendar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Calendar grid (left 2 cols) ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Nav */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-black text-white tracking-wide">
                    {ETH_MONTHS[ecMonth - 1]} {ecYear} E.C.
                  </h3>
                  <p className="text-blue-200 text-xs font-medium">Ethiopian Calendar</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToday}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading calendar…</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`e${i}`} className="h-20 md:h-24 border-b border-r border-slate-50 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-800/10" />
                  ))}
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                    const dayEvts = getEventsForDay(day);
                    const today   = isToday(day);
                    const cellBg  = dayEvts[0] ? (CELL_BG[dayEvts[0].type] || '') : '';
                    return (
                      <div
                        key={day}
                        onClick={() => dayEvts.length > 0 && setSelectedDay({ day, events: dayEvts })}
                        className={`h-20 md:h-24 border-b border-r border-slate-100 dark:border-slate-800/40 p-1.5 flex flex-col transition-all ${cellBg} ${dayEvts.length > 0 ? 'cursor-pointer hover:ring-2 hover:ring-blue-400/40' : ''} ${selectedDay?.day === day ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold self-end mb-1 ${today ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {dayEvts.slice(0, 2).map((ev, idx) => {
                            const s = style(ev.type);
                            return (
                              <span key={idx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate ${s.badge}`}>
                                {ev.title}
                              </span>
                            );
                          })}
                          {dayEvts.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold pl-1">+{dayEvts.length - 2}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Day detail pop-in */}
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {ETH_MONTHS[ecMonth - 1]} {selectedDay.day}, {ecYear} E.C.
                  </h4>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedDay.events.map((ev, i) => {
                    const s = style(ev.type);
                    return (
                      <div key={i} className={`flex gap-3 p-3 rounded-xl ${s.bg}`}>
                        <div className={`w-1.5 flex-shrink-0 rounded-full ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${s.text}`}>{ev.title}</p>
                          {ev.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{ev.description}</p>}
                          <span className={`inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>{ev.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Sidebar (right col) ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* This month */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={14} />
                  {ETH_MONTHS[ecMonth - 1]} Events
                </h3>
              </div>
              <div className="p-4">
                {monthEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No events scheduled this month.</p>
                ) : (
                  <div className="space-y-3">
                    {monthEvents.map((ev, i) => {
                      const s = style(ev.type);
                      const ethStart = gregorianToEthiopian(new Date(ev.date));
                      const hasRange = ev.end_date && ev.end_date.slice(0, 10) !== ev.date.slice(0, 10);
                      const ethEnd   = hasRange ? gregorianToEthiopian(new Date(ev.end_date)) : null;
                      return (
                        <div key={i} className={`flex gap-3 items-start p-3 rounded-xl ${s.bg} group`}>
                          <div className="text-center px-2 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 min-w-[54px]">
                            {ethEnd ? (
                              <>
                                <p className={`text-[10px] font-black ${s.text}`}>{ETH_MONTHS[ethStart.month - 1].slice(0, 3)}</p>
                                <p className={`text-base font-black leading-none ${s.text}`}>{ethStart.day}</p>
                                <p className="text-[8px] text-slate-400 font-bold">–{ethEnd.day}</p>
                              </>
                            ) : (
                              <>
                                <p className={`text-[10px] font-black ${s.text}`}>{ETH_MONTHS[ethStart.month - 1].slice(0, 3)}</p>
                                <p className={`text-lg font-black leading-none ${s.text}`}>{ethStart.day}</p>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${s.text} truncate`}>{ev.title}</p>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge} mt-1 inline-block`}>{ev.type}</span>
                            {ev.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming events */}
            {upcoming.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Upcoming Events</h3>
                </div>
                <div className="p-4 space-y-3">
                  {upcoming.map((ev, i) => {
                    const s = style(ev.type);
                    const ethD = gregorianToEthiopian(new Date(ev.date));
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{ev.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {ETH_MONTHS[ethD.month - 1]} {ethD.day}, {ethD.year} E.C.
                          </p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>{ev.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Event Types</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(EVENT_PILL).map(([type, s]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${s.dot}`} />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SchoolCalendar;
