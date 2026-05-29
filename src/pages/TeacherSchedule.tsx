import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Info, Loader2, BookOpen, Layers } from 'lucide-react';
import { getTeacherSchedule } from '../services/teacherService';

export const TeacherSchedule = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getTeacherSchedule();
        setSchedule(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredSchedule = selectedDayFilter === 'All'
    ? schedule
    : schedule.filter(item => item.day === selectedDayFilter);

  // Group schedules by day for custom rendering
  const scheduleByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = schedule.filter(item => item.day === day);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={40} />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Loading your timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner / Title Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-8 rounded-3xl shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
              <Calendar size={30} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">My Teaching Schedule</h2>
              <p className="text-indigo-100/90 font-medium mt-1">
                Your dynamically loaded weekly lecture and class schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / View Selection */}
      <div className="flex flex-wrap items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => setSelectedDayFilter('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
            selectedDayFilter === 'All'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Show All
        </button>
        {daysOfWeek.map(day => {
          const hasClasses = scheduleByDay[day]?.length > 0;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                selectedDayFilter === day
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{day}</span>
              {hasClasses && (
                <span className={`w-1.5 h-1.5 rounded-full ${selectedDayFilter === day ? 'bg-white' : 'bg-indigo-500'}`}></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedule.length > 0 ? (
          filteredSchedule.map((slot, i) => (
            <div
              key={slot.id || i}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-extrabold uppercase tracking-wider">
                    {slot.day}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
                    <Clock size={16} />
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-1 bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-snug">
                      {slot.subject}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>{slot.time_slot || 'No time set'}</span>
                      {slot.period_number && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                          Period {slot.period_number}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Layers size={14} className="text-indigo-500" />
                  <span>Class: {slot.class_name || 'Unassigned'} {slot.section ? `(${slot.section})` : ''}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <MapPin size={14} />
                  <span>Main Campus</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12">
            <Info className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={40} />
            <p className="text-slate-500 dark:text-slate-400 font-semibold mb-1">No schedule found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">There are no classes scheduled for {selectedDayFilter === 'All' ? 'any day' : selectedDayFilter}.</p>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-6 rounded-3xl flex items-start gap-4 shadow-sm backdrop-blur-md">
        <div className="bg-amber-500 text-white p-2.5 rounded-2xl shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-400">Timetable & Schedule Sync</h4>
          <p className="text-sm text-amber-800/80 dark:text-amber-500/80 mt-1 font-medium leading-relaxed">
            This schedule is automatically updated and synced with the School Administration's Schedule Builder. 
            If you notice conflicts or require adjustments, please coordinate with your Department Head or Principal.
          </p>
        </div>
      </div>
    </div>
  );
};
