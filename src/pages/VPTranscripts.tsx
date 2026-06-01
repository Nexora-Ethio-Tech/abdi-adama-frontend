import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronRight, Download, FileText, Loader2, Printer, Search, Users, X } from 'lucide-react';
import * as vicePrincipalService from '../services/vicePrincipalService';
import { TranscriptTemplate, TranscriptTemplateData } from '../components/TranscriptTemplate';

type GradeSection = {
  grade_name: string;
  sections: Array<{
    id: string;
    section_name: string;
    student_count: number;
    capacity: number;
  }>;
};

type StudentSearchResult = {
  id: string;
  name: string;
  digitalId?: string;
  username?: string;
  grade: string;
  section: string;
};

type TranscriptCourse = {
  courseId: string;
  courseName: string;
  grades: Array<{ percentage?: number }>;
};

type StudentTranscript = {
  studentId: string;
  studentName: string;
  className?: string;
  section?: string;
  overallAverage?: number;
  academicYear?: string;
  semester?: string;
  overallRank?: string | number;
  courses: TranscriptCourse[];
};

const buildFallbackTemplate = (label: string): TranscriptTemplateData => ({
  name: label || 'Unknown Student',
  id: label || 'N/A',
  academicYear: 'N/A',
  semester: 'N/A',
  subjects: [{ name: 'No grades found', mark: 0, grade: '0' }],
  average: 0,
  rank: 0
});

export const VPTranscripts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupLabel, setLookupLabel] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [gradeGroups, setGradeGroups] = useState<GradeSection[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionStudents, setSectionStudents] = useState<StudentSearchResult[]>([]);
  const [transcript, setTranscript] = useState<StudentTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [loadingSectionStudents, setLoadingSectionStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        setLoadingHierarchy(true);
        const groups = await vicePrincipalService.getGradesAndSections();
        setGradeGroups(groups || []);
      } catch (err: any) {
        console.error('Failed to load grade hierarchy:', err);
        setError(err.response?.data?.error?.message || 'Failed to load grades and sections');
      } finally {
        setLoadingHierarchy(false);
      }
    };

    loadHierarchy();
  }, []);

  useEffect(() => {
    if (!selectedGrade && gradeGroups.length > 0) {
      setSelectedGrade(gradeGroups[0].grade_name);
    }
  }, [gradeGroups, selectedGrade]);

  useEffect(() => {
    const selectedGradeGroup = gradeGroups.find((group) => group.grade_name === selectedGrade);
    if (!selectedGradeGroup) {
      setSelectedSection('');
      setSectionStudents([]);
      return;
    }

    const firstSection = selectedGradeGroup.sections[0];
    if (firstSection && !selectedSection) {
      setSelectedSection(firstSection.id);
    }
  }, [gradeGroups, selectedGrade, selectedSection]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSection) {
        setSectionStudents([]);
        return;
      }

      try {
        setLoadingSectionStudents(true);
        const students = await vicePrincipalService.getStudentsBySection(selectedSection);
        setSectionStudents(students || []);
      } catch (err: any) {
        console.error('Failed to load section students:', err);
        setError(err.response?.data?.error?.message || 'Failed to load section students');
        setSectionStudents([]);
      } finally {
        setLoadingSectionStudents(false);
      }
    };

    loadStudents();
  }, [selectedSection]);

  const openTranscript = async (lookupValue: string, displayLabel?: string) => {
    const trimmedLookup = lookupValue.trim();
    if (!trimmedLookup) return;

    try {
      setLoading(true);
      setError(null);
      setLookupLabel(displayLabel || trimmedLookup);
      const data = await vicePrincipalService.getStudentTranscript(trimmedLookup);
      setTranscript(data as StudentTranscript);
    } catch (err: any) {
      console.error('Transcript fetch failed:', err);
      setTranscript(null);
      setLookupLabel(displayLabel || trimmedLookup);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    try {
      setSearching(true);
      setError(null);
      setLookupLabel(query);
      const results = await vicePrincipalService.searchStudents(query);
      setSearchResults(results || []);

      if (results.length === 1) {
        const single = results[0];
        await openTranscript(single.digitalId || single.id, single.name);
      } else {
        setTranscript(null);
      }
    } catch (err: any) {
      console.error('Student search failed:', err);
      setSearchResults([]);
      setTranscript(null);
      setLookupLabel(query);
      setError(null);
    } finally {
      setSearching(false);
    }
  };

  const templateData = useMemo<TranscriptTemplateData | null>(() => {
    if (transcript) {
      const subjects = transcript.courses.map((course) => {
        const grades = course.grades || [];
        const courseAverage = grades.length
          ? Math.round(grades.reduce((sum, grade) => sum + Number(grade.percentage || 0), 0) / grades.length)
          : 0;

        return {
          name: course.courseName,
          mark: courseAverage,
          grade: courseAverage >= 90 ? 'A+' : courseAverage >= 80 ? 'A' : courseAverage >= 70 ? 'B' : courseAverage >= 60 ? 'C' : 'D'
        };
      });

      return {
        name: transcript.studentName || lookupLabel || 'Unknown Student',
        id: transcript.studentId || lookupLabel || 'N/A',
        academicYear: transcript.academicYear || 'N/A',
        semester: transcript.semester || 'N/A',
        subjects: subjects.length > 0 ? subjects : [{ name: 'No grades found', mark: 0, grade: '0' }],
        average: transcript.overallAverage != null ? transcript.overallAverage.toFixed(1) : 0,
        rank: transcript.overallRank ?? 0
      };
    }

    if (lookupLabel) {
      return buildFallbackTemplate(lookupLabel);
    }

    return null;
  }, [lookupLabel, transcript]);

  const printTranscript = () => {
    // `transcript-print` class and print CSS ensure only the transcript is visible when printing
    window.print();
  };

  const currentGradeGroup = gradeGroups.find((group) => group.grade_name === selectedGrade);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const styleId = 'transcript-print-style';
    if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `@media print { body * { visibility: hidden !important; } .transcript-print, .transcript-print * { visibility: visible !important; } .transcript-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; } }`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Student Transcripts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search by name, digital ID, username, or browse grade, section, and student lists.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={printTranscript}
            disabled={!templateData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={() => {
              setTranscript(null);
              setSearchResults([]);
              setLookupLabel('Blank Template');
              setSearchQuery('');
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download size={16} />
            Blank Template
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search student by name or ID"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              disabled={searching}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {searching ? 'Searching...' : 'Search'}
            </button>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Search Results</p>
                {searchResults.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => openTranscript(student.digitalId || student.id, student.name)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {student.digitalId || student.id} · {student.grade} · {student.section}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Grades & Sections</h2>
            </div>

            {loadingHierarchy ? (
              <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading grades...
              </div>
            ) : gradeGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No grades available for this branch.
              </div>
            ) : (
              <div className="space-y-3">
                {gradeGroups.map((group) => {
                  const active = group.grade_name === selectedGrade;

                  return (
                    <div key={group.grade_name} className="rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setSelectedGrade(group.grade_name);
                          setSelectedSection(group.sections[0]?.id || '');
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        <span className="font-bold">{group.grade_name}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          {group.sections.length} sections
                        </span>
                      </button>

                      {active && (
                        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {group.sections.map((section) => (
                              <button
                                key={section.id}
                                onClick={() => setSelectedSection(section.id)}
                                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${selectedSection === section.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                              >
                                {section.section_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Students</h2>
              </div>
              {selectedSection && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{selectedSection}</span>
              )}
            </div>

            {loadingSectionStudents ? (
              <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading students...
              </div>
            ) : sectionStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No students found for this section.
              </div>
            ) : (
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {sectionStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => openTranscript(student.digitalId || student.id, student.name)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.digitalId || student.id}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {!templateData ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <FileText className="mx-auto mb-4 h-16 w-16 text-slate-400" />
              Search for a student or select one from the grade hierarchy to load a transcript.
            </div>
          ) : (
            <div ref={transcriptRef} className="transcript-print overflow-x-auto rounded-[2rem] border border-slate-200 bg-slate-100 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-950 print:border-0 print:bg-white print:p-0 print:shadow-none">
              <TranscriptTemplate studentData={templateData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
