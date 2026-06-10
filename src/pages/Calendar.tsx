import { useState, useEffect, useCallback } from 'react';
import { EthiopianDatePicker } from '../components/EthiopianDatePicker';
import { ChevronLeft, ChevronRight, Plus, Tag, Trash2, Edit, X, Calendar as CalendarIcon } from 'lucide-react';
import { gregorianToEthiopian, ethiopianToGregorianIso } from '../utils/ethiopianCalendar';
import { dashboardService } from '../services/dashboardService';
import { useUser } from '../context/UserContext';

const ETH_MONTHS = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
  'Megabit','Miazia','Ginbot','Sene','Hamle','Nehase','Pagume'
];

const EVENT_COLORS: Record<string, string> = {
  Academic:  'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  Meeting:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Event:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Holiday:   'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300',
};

function daysInEthMonth(y: number, m: number) {
  if (m >= 1 && m <= 12) return 30;
  return y % 4 === 3 ? 6 : 5; // Pagume: leap year check
}

function ethFirstDayOfWeek(y: number, m: number) {
  const gregIso = ethiopianToGregorianIso(`${y}-${String(m).padStart(2,'0')}-01`);
  if (!gregIso) return 0;
  return new Date(gregIso).getDay();
}

function gregIsoForEthDay(y: number, m: number, d: number) {
  return ethiopianToGregorianIso(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
}

export const Calendar = ({ compact = false }: { compact?: boolean }) => {
  const { user, role } = useUser();
  const canManage = role === 'super-admin' || role === 'school-admin';

  // Current Ethiopian month/year state
  const todayEth = gregorianToEthiopian(new Date());
  const [ecYear, setEcYear] = useState(todayEth.year);
  const [ecMonth, setEcMonth] = useState(todayEth.month);

  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[] | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '', date: '', type: 'Academic', description: '', branchId: ''
  });

  const fetchEvents = useCallback(async () => {
    if (!role) return;
    setLoadingEvents(true);
    try {
      const data = await dashboardService.getEvents(role, (user as any)?.branchId ?? null);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [role, user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Navigation
  const prevMonth = () => {
    if (ecMonth === 1) { setEcMonth(13); setEcYear(y => y - 1); }
    else setEcMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (ecMonth === 13) { setEcMonth(1); setEcYear(y => y + 1); }
    else setEcMonth(m => m + 1);
  };
  const goToday = () => { setEcYear(todayEth.year); setEcMonth(todayEth.month); };

  const totalDays = daysInEthMonth(ecYear, ecMonth);
  const firstDow  = ethFirstDayOfWeek(ecYear, ecMonth);
  const emptyLeading = Array.from({ length: firstDow });

  const getEventsForDay = (d: number) => {
    const gregIso = gregIsoForEthDay(ecYear, ecMonth, d);
    if (!gregIso) return [];
    return events.filter(e => e.date?.slice(0, 10) === gregIso);
  };

  const isToday = (d: number) => {
    return ecYear === todayEth.year && ecMonth === todayEth.month && d === todayEth.day;
  };

  // Month events list (sidebar)
  const monthEvents = events.filter(e => {
    if (!e.date) return false;
    const gregIso = e.date.slice(0, 10);
    // Check any day in this ec month
    const firstDay = gregIsoForEthDay(ecYear, ecMonth, 1);
    const lastDay  = gregIsoForEthDay(ecYear, ecMonth, totalDays);
    if (!firstDay || !lastDay) return false;
    return gregIso >= firstDay && gregIso <= lastDay;
  });

  // Modal helpers
  const openCreate = () => {
    setEditingEvent(null);
    const todayEth = gregorianToEthiopian(new Date());
    const todayEthStr = `${todayEth.year}-${String(todayEth.month).padStart(2,'0')}-${String(todayEth.day).padStart(2,'0')}`;
    setForm({ title: '', date: todayEthStr, type: 'Academic', description: '', branchId: '' });
    setFormError('');
    setShowModal(true);
  };
  const openEdit = (ev: any) => {
    setEditingEvent(ev);
    let ethDateStr = '';
    if (ev.date) {
      const ethD = gregorianToEthiopian(new Date(ev.date));
      ethDateStr = `${ethD.year}-${String(ethD.month).padStart(2,'0')}-${String(ethD.day).padStart(2,'0')}`;
    }
    setForm({
      title: ev.title ?? '',
      date: ethDateStr,
      type: ev.type ?? 'Academic',
      description: ev.description ?? '',
      branchId: ev.branch_id ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      setFormError('Title and date are required.');
      return;
    }
    const gregDate = ethiopianToGregorianIso(form.date);
    if (!gregDate) {
      setFormError('Please select a valid Ethiopian date.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        date: gregDate,
        type: form.type,
        description: form.description.trim() || undefined,
        branchId: form.branchId || null,
      };
      if (editingEvent) {
        await dashboardService.updateEvent(role!, editingEvent.id, payload);
      } else {
        await dashboardService.createEvent(role!, payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await dashboardService.deleteEvent(role!, id);
      fetchEvents();
    } catch {
      alert('Failed to delete event.');
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between ${compact ? 'gap-2' : 'gap-4'}`}>
        <div>
          <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-slate-800 dark:text-slate-100`}>Academic Calendar</h2>
          {!compact && <p className="text-slate-500 dark:text-slate-400 text-sm">Ethiopian calendar — all school events and holidays.</p>}
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className={`bg-blue-600 hover:bg-blue-700 text-white ${compact ? 'px-3 py-1.5 rounded-lg text-xs' : 'px-4 py-2 rounded-xl text-sm'} flex items-center gap-2 transition-colors font-bold shadow-lg shadow-blue-200 dark:shadow-none`}
          >
            <Plus size={16} />
            Add Event
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} ${compact ? 'gap-4' : 'gap-6'}`}>
        {/* Calendar Grid */}
        <div className={compact ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className={`border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${compact ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Previous month"
                  onClick={prevMonth}
                  className={`hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${compact ? 'p-1.5' : 'p-2'}`}
                >
                  <ChevronLeft size={compact ? 18 : 20} />
                </button>
                <div>
                  <h3 className={`font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-sm' : 'text-lg'}`}>
                    {ETH_MONTHS[ecMonth - 1]} {ecYear} E.C.
                  </h3>
                  {!compact && <p className="text-xs text-slate-400">Ethiopian Calendar</p>}
                </div>
                <button
                  type="button"
                  title="Next month"
                  onClick={nextMonth}
                  className={`hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${compact ? 'p-1.5' : 'p-2'}`}
                >
                  <ChevronRight size={compact ? 18 : 20} />
                </button>
              </div>
              <button
                onClick={goToday}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className={`text-center font-bold text-slate-400 uppercase tracking-wider ${compact ? 'py-1.5 text-[10px]' : 'py-3 text-xs'}`}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {emptyLeading.map((_, i) => (
                <div key={`e-${i}`} className={`border-b border-r border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/10 ${compact ? 'h-14 md:h-16' : 'h-24 md:h-28'}`} />
              ))}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDayEvents(dayEvents);
                        setSelectedDayNumber(day);
                      }
                    }}
                    className={`border-b border-r border-slate-100 dark:border-slate-800 p-1 group transition-colors ${
                      today ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    } ${compact ? 'h-14 md:h-16' : 'h-24 md:h-28'} ${dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
                  >
                    <span className={`font-bold inline-flex items-center justify-center rounded-full ${compact ? 'text-xs w-5 h-5' : 'text-sm w-7 h-7'} ${
                      today
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                    }`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, compact ? 1 : 2).map(ev => (
                        <div
                          key={ev.id}
                          title={ev.title}
                          className={`rounded font-bold truncate cursor-pointer ${compact ? 'px-1 py-0.2 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'} ${EVENT_COLORS[ev.type] ?? EVENT_COLORS.Event}`}
                          onClick={(e) => {
                            if (canManage) {
                              e.stopPropagation();
                              openEdit(ev);
                            }
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > (compact ? 1 : 2) && (
                        <p className={`text-slate-400 font-bold px-1 ${compact ? 'text-[7px]' : 'text-[10px]'}`}>+{dayEvents.length - (compact ? 1 : 2)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingEvents && (
              <div className="p-4 text-center text-sm text-slate-400">
                <div className="inline-block w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-2" />
                Loading events…
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={compact ? "space-y-3" : "space-y-5"}>
          {/* Legend */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Event Types</h4>
            <div className="space-y-2">
              {Object.entries(EVENT_COLORS).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-sm flex-shrink-0 ${cls.split(' ')[0]}`} />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* This Month's Events */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarIcon size={14} className="text-blue-500" />
              {ETH_MONTHS[ecMonth - 1]} Events
            </h3>
            {monthEvents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No events scheduled this month.</p>
            ) : (
              <div className="space-y-3">
                {monthEvents.map(ev => {
                  const ethDate = gregorianToEthiopian(new Date(ev.date));
                  return (
                    <div key={ev.id} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group">
                      <div className="text-center px-2 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <p className="text-base font-black text-blue-600 dark:text-blue-400">{ethDate.day}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{ETH_MONTHS[ethDate.month - 1]?.slice(0, 3)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{ev.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag size={10} className="text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] text-slate-500">{ev.type}</span>
                        </div>
                        {ev.description && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            type="button"
                            title="Edit event"
                            aria-label="Edit event"
                            onClick={() => openEdit(ev)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition-colors"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete event"
                            aria-label="Delete event"
                            onClick={() => handleDelete(ev.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                type="button"
                title="Close modal"
                aria-label="Close modal"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-xs text-rose-700 dark:text-rose-300">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date (Ethiopian Calendar) *</label>
                <EthiopianDatePicker
                  value={form.date}
                  onChange={val => setForm(f => ({ ...f, date: val }))}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label htmlFor="event-type-select" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                <select
                  id="event-type-select"
                  title="Event type"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.keys(EVENT_COLORS).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Events Details Modal */}
      {selectedDayEvents && selectedDayEvents.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Events for {ETH_MONTHS[ecMonth - 1]} {selectedDayNumber}, {ecYear} E.C.
              </h3>
              <button
                type="button"
                title="Close day events modal"
                onClick={() => {
                  setSelectedDayEvents(null);
                  setSelectedDayNumber(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {selectedDayEvents.map(ev => (
                <div key={ev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${EVENT_COLORS[ev.type] ?? EVENT_COLORS.Event}`}>
                      {ev.type}
                    </span>
                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          title="Edit event"
                          onClick={() => {
                            setSelectedDayEvents(null);
                            setSelectedDayNumber(null);
                            openEdit(ev);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete event"
                          onClick={() => {
                            setSelectedDayEvents(null);
                            setSelectedDayNumber(null);
                            handleDelete(ev.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">{ev.title}</h4>
                  {ev.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{ev.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
