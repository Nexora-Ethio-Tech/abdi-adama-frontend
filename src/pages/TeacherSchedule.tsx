import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Loader2, Info, Layers } from 'lucide-react';
import { getTeacherSchedule } from '../services/teacherService';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const DAY_COLORS: Record<string, string> = {
  Monday:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  Tuesday:   'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900',
  Wednesday: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  Thursday:  'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  Friday:    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
};

const DAY_HEADER_COLORS: Record<string, string> = {
  Monday:    'bg-blue-600',
  Tuesday:   'bg-violet-600',
  Wednesday: 'bg-emerald-600',
  Thursday:  'bg-amber-500',
  Friday:    'bg-rose-600',
};

export const TeacherSchedule = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTeacherSchedule();
        // Filter only Mon–Fri entries
        const filtered = (Array.isArray(data) ? data : []).filter((s: any) =>
          WEEKDAYS.includes(s.day as any)
        );
        setSchedule(filtered);
      } catch (err: any) {
        console.error('Failed to fetch schedule:', err);
        setError('Could not load schedule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Group by day
  const scheduleByDay: Record<string, any[]> = WEEKDAYS.reduce((acc, day) => {
    acc[day] = schedule.filter(s => s.day === day);
    return acc;
  }, {} as Record<string, any[]>);

  const totalSlots = schedule.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={40} />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-8 rounded-3xl shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Calendar size={30} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">My Schedule</h2>
              <p className="text-indigo-100/90 font-medium mt-1">
                Your weekly teaching timetable — Monday to Friday
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-center">
              <p className="text-2xl font-black">{totalSlots}</p>
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Total Slots</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Schedule Grid — one column per weekday */}
      {totalSlots === 0 && !error ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <Info className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={40} />
          <p className="text-slate-500 dark:text-slate-400 font-semibold mb-1">No schedule assigned yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Your schedule will appear here once the school admin sets it up in the Schedule Builder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WEEKDAYS.map(day => {
            const slots = scheduleByDay[day];
            const headerColor = DAY_HEADER_COLORS[day];
            return (
              <div key={day} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {/* Day header */}
                <div className={`${headerColor} text-white px-4 py-3 text-center`}>
                  <p className="text-xs font-black uppercase tracking-widest">{day}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">{slots.length} class{slots.length !== 1 ? 'es' : ''}</p>
                </div>

                {/* Slots */}
                {slots.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs font-medium italic py-8">
                    No classes
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {slots
                      .slice()
                      .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''))
                      .map((slot, i) => (
                        <div key={slot.id || i} className="p-4 space-y-2">
                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={11} />
                            <span>{slot.time_slot || 'Time TBD'}</span>
                            {slot.period_number && (
                              <span className="ml-auto bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                P{slot.period_number}
                              </span>
                            )}
                          </div>

                          {/* Subject */}
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 p-1.5 rounded-lg border ${DAY_COLORS[day]} shrink-0`}>
                              <BookOpen size={13} />
                            </div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                              {slot.subject || 'Subject TBD'}
                            </p>
                          </div>

                          {/* Class / Section */}
                          {(slot.class_name || slot.section) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <Layers size={11} className="text-indigo-400" />
                              <span>
                                {slot.class_name || ''}
                                {slot.section ? ` (${slot.section})` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info notice */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-6 rounded-3xl flex items-start gap-4 shadow-sm">
        <div className="bg-amber-500 text-white p-2.5 rounded-2xl shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-400">Schedule is set by Administration</h4>
          <p className="text-sm text-amber-800/80 dark:text-amber-500/80 mt-1 font-medium leading-relaxed">
            This timetable is managed by the school admin via the Schedule Builder and applies for the entire week.
            If you notice any conflicts, please contact your Department Head or Principal.
          </p>
        </div>
      </div>
    </div>
  );
};
