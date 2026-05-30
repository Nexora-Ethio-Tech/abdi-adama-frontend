
import { BookOpen, Award, Clock, Star, Trophy, Loader2, Megaphone, Bell, User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  getStudentDashboard,
  getTeacherOfWeek,
  submitTeacherOfWeekVote,
  StudentDashboard,
  TeacherOfWeekPayload,
  WeeklyScheduleEntry,
} from '../services/studentPortalService';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const StudentPortal = () => {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [teacherOfWeek, setTeacherOfWeek] = useState<TeacherOfWeekPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, tow] = await Promise.all([
        getStudentDashboard(),
        getTeacherOfWeek().catch(() => null),
      ]);
      setDashboard(data);
      setTeacherOfWeek(tow);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showVotingCard =
    teacherOfWeek?.isOpen &&
    !teacherOfWeek.hasVoted &&
    (teacherOfWeek.teachers?.length ?? 0) > 0;

  const handleVote = async (teacherId: string) => {
    setVoting(true);
    setVoteError(null);
    try {
      await submitTeacherOfWeekVote(teacherId);
      setTeacherOfWeek((prev) =>
        prev
          ? { ...prev, hasVoted: true, votedTeacherId: teacherId }
          : prev
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit vote';
      setVoteError(msg);
    } finally {
      setVoting(false);
    }
  };

  const weeklySchedule = dashboard?.weeklySchedule ?? [];
  const schoolAnnouncements = dashboard?.schoolAnnouncements ?? [];
  const logisticsAnnouncements = dashboard?.logisticsAnnouncements ?? [];

  const getScheduleForDay = (day: string, schedule: WeeklyScheduleEntry[]) =>
    schedule.filter((s) => s.day === day).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const timeSlots = Array.from(new Set(weeklySchedule.map((s) => s.timeSlot))).sort();

  const attendanceDisplay =
    dashboard?.stats.attendanceRate != null
      ? `${dashboard.stats.attendanceRate}%`
      : 'N/A';

  const averageGradeDisplay = dashboard?.stats.averageGradeDisplay ?? 'Pending';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {showVotingCard && (
        <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden mb-8 border border-white/10">
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 rotate-12 pointer-events-none">
            <Trophy className="w-20 h-20 md:w-32 md:h-32 lg:w-[140px] lg:h-[140px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <Star size={12} fill="currentColor" /> Weekend Special
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">Teacher of the Week</h2>
                <p className="text-sm md:text-base font-medium opacity-80">
                  Vote for your best teacher this week. Voting is open from Saturday through Wednesday (Ethiopian calendar week).
                </p>
              </div>

              <div className="flex-1 w-full max-w-xl">
                {voteError && (
                  <p className="text-sm font-bold text-rose-200 mb-3">{voteError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teacherOfWeek!.teachers.map((teacher) => (
                    <motion.button
                      key={teacher.id}
                      type="button"
                      disabled={voting}
                      whileHover={{ scale: voting ? 1 : 1.02 }}
                      whileTap={{ scale: voting ? 1 : 0.98 }}
                      onClick={() => handleVote(teacher.id)}
                      className="p-4 rounded-3xl backdrop-blur-xl transition-all text-left relative group border-2 bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm bg-white/20 flex-shrink-0">
                          {teacher.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black truncate">{teacher.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 text-white truncate">
                            {teacher.subjects[0] || teacher.department || 'Teacher'}
                          </p>
                        </div>
                        {voting && (
                          <Loader2 size={16} className="ml-auto animate-spin opacity-80" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black">
                Welcome back, {dashboard?.student?.name || 'Student'}!
              </h2>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
              <Award size={160} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600 w-fit mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-slate-500 text-sm font-medium">Active Courses</h3>
              <p className="text-2xl font-bold text-slate-800 mt-1">{dashboard?.stats.totalCourses ?? 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 w-fit mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-slate-500 text-sm font-medium">Attendance Rate</h3>
              <p className="text-2xl font-bold text-slate-800 mt-1">{attendanceDisplay}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600 w-fit mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-slate-500 text-sm font-medium">Average Grade</h3>
              <p className="text-2xl font-bold text-slate-800 mt-1">{averageGradeDisplay}</p>
              {dashboard?.stats.currentSemester === 2 && (
                <p className="text-xs text-slate-400 mt-1">First semester average</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">My Schedule</h3>
            {weeklySchedule.length === 0 ? (
              <p className="text-sm text-slate-500">No schedule published for your class yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                      {WEEK_DAYS.map((day) => (
                        <th key={day} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timeSlots.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {timeSlot}
                          </div>
                        </td>
                        {WEEK_DAYS.map((day) => {
                          const session = getScheduleForDay(day, weeklySchedule).find(
                            (s) => s.timeSlot === timeSlot
                          );
                          return (
                            <td key={day} className="px-4 py-4 align-top">
                              {session ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-900">{session.subject}</p>
                                  <p className="text-xs text-slate-600 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {session.teacher}
                                  </p>
                                  {session.room && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {session.room}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(schoolAnnouncements.length > 0 || logisticsAnnouncements.length > 0) && (
            <div className={`grid grid-cols-1 gap-8 ${schoolAnnouncements.length > 0 && logisticsAnnouncements.length > 0 ? 'lg:grid-cols-2' : ''}`}>
              {schoolAnnouncements.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">School Announcements</h3>
                      <p className="text-xs text-slate-500">Official updates from the administration</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {schoolAnnouncements.map((notice) => (
                      <div key={notice.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            notice.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {notice.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(notice.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{notice.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {logisticsAnnouncements.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Logistics & Driver Logs</h3>
                      <p className="text-xs text-slate-500">Real-time school bus and transit logs</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {logisticsAnnouncements.map((notice) => (
                      <div key={notice.id} className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/40 hover:border-indigo-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            Logistics
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(notice.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{notice.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">{notice.content}</p>
                        {notice.driverName && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider pt-2 border-t border-indigo-100/30">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                            Driver: {notice.driverName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
