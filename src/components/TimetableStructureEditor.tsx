import React, { useState, useEffect } from 'react';

interface ClassRecord {
  id: string;
  name: string;
  section?: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface StructureRow {
  id: string;
  classId: string;
  teacherId: string;
  subject: string;
  sessionsPerWeek: number;
}

interface Props {
  classes: ClassRecord[];
  teachers: Teacher[];
  initialRows?: StructureRow[];
  onSave: (rows: StructureRow[]) => Promise<void> | void;
}

// Helper to extract grade key and section from class name
const parseClassName = (name: string) => {
  const match = name.match(/^(Grade\s+\d+)([A-Z])?$/i);
  if (match) return { grade: match[1], section: (match[2] || '').toUpperCase() };
  const m2 = name.match(/^(.*?\d+)([A-Z])$/i);
  if (m2) return { grade: m2[1], section: (m2[2] || '').toUpperCase() };
  return { grade: name, section: '' };
};

const TimetableStructureEditor: React.FC<Props> = ({ classes, teachers, initialRows = [], onSave }) => {
  const [gradeMap, setGradeMap] = useState<Record<string, { displayName?: string; sections: { name: string; classId?: string }[]; courses: any[]; assignments?: Record<string, Record<string,string>>; collapsed?: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [newGradeInput, setNewGradeInput] = useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const map: Record<string, { displayName?: string; sections: { name: string; classId?: string }[]; courses: any[]; assignments?: Record<string, Record<string,string>>; collapsed?: boolean }> = {};
    classes.forEach(c => {
      const { grade, section } = parseClassName(c.name || '');
      if (!map[grade]) map[grade] = { sections: [], courses: [] };
      if (section) map[grade].sections.push({ name: section, classId: c.id });
      else map[grade].sections.push({ name: c.section || 'A', classId: c.id });
      // set display name to friendly grade label
      map[grade].displayName = grade;
      // initialize assignments map for each section
      if (!map[grade].assignments) map[grade].assignments = {};
      const secName = section || c.section || 'A';
      if (!map[grade].assignments[secName]) map[grade].assignments[secName] = {};
    });
    setGradeMap(map);
  }, [classes]);

  const addGrade = (gradeName?: string) => {
    let input = (gradeName || '').trim();
    // create a unique internal key
    const key = `grade_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    let display = '';
    if (!input) {
      display = `Untitled Grade`;
    } else {
      // If user entered a plain number like '10', convert to 'Grade 10'
      display = /^\d+$/.test(input) ? `Grade ${input}` : input;
    }
    setGradeMap(prev => ({ ...prev, [key]: { displayName: display, sections: [], courses: [] } }));
    setNewGradeInput('');
    // scroll to bottom so newly added grade is visible
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 80);
  };

  const updateGradeDisplayName = (gradeKey: string, name: string) => {
    setGradeMap(prev => {
      const entry = prev[gradeKey];
      if (!entry) return prev;
      return { ...prev, [gradeKey]: { ...entry, displayName: name } };
    });
  };

  const expandGradeOnly = (gradeKey: string) => {
    setGradeMap(prev => {
      const next: typeof prev = {} as typeof prev;
      Object.keys(prev).forEach(key => {
        next[key] = { ...prev[key], collapsed: key === gradeKey ? false : true };
      });
      return next;
    });
  };

  const addCourse = (gradeKey: string) => {
    expandGradeOnly(gradeKey);
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const id = Date.now().toString();
        const course = { id, name: '', sessionsPerWeek: 3 };
        const updated = { ...prev, [gradeKey]: { ...g, courses: [...g.courses, course] } };
      return updated;
    });
    // ensure scroll to bottom so new course is visible
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 80);
  };

  const addSection = (gradeKey: string) => {
    expandGradeOnly(gradeKey);
    const existing = gradeMap[gradeKey]?.sections || [];
    const defaultName = `New Section ${existing.length + 1}`;
    const trimmed = defaultName;

    setGradeMap(prev => {
      const g = prev[gradeKey];
      if (!g) return prev;

      if (g.sections.some(section => section.name.toUpperCase() === trimmed)) {
        return prev;
      }

      return {
        ...prev,
        [gradeKey]: {
          ...g,
          sections: [...g.sections, { name: trimmed }],
          assignments: {
            ...(g.assignments || {}),
            [trimmed]: { ...(g.assignments?.[trimmed] || {}) },
          },
        },
      };
    });

    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 80);
  };

  const removeSection = (gradeKey: string, sectionName: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      if (!g) return prev;

      const sections = g.sections.filter(section => section.name !== sectionName);
      const assignments = { ...(g.assignments || {}) } as Record<string, Record<string, string>>;
      delete assignments[sectionName];

      return {
        ...prev,
        [gradeKey]: {
          ...g,
          sections,
          assignments,
        },
      };
    });
  };

  const updateSectionName = (gradeKey: string, oldName: string, nextName: string) => {
    const normalized = nextName.trim().toUpperCase();
    if (!normalized) return;

    setGradeMap(prev => {
      const g = prev[gradeKey];
      if (!g) return prev;

      if (oldName === normalized) return prev;

      const duplicate = g.sections.some(section => section.name.toUpperCase() === normalized && section.name !== oldName);
      if (duplicate) return prev;

      const sections = g.sections.map(section => (section.name === oldName ? { ...section, name: normalized } : section));
      const assignments = { ...(g.assignments || {}) } as Record<string, Record<string, string>>;
      if (assignments[oldName]) {
        assignments[normalized] = { ...(assignments[normalized] || {}), ...assignments[oldName] };
        delete assignments[oldName];
      } else if (!assignments[normalized]) {
        assignments[normalized] = {};
      }

      return { ...prev, [gradeKey]: { ...g, sections, assignments } };
    });
  };

  const updateCourse = (gradeKey: string, courseId: string, changes: Partial<any>) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const courses = g.courses.map((c: any) => c.id === courseId ? { ...c, ...changes } : c);
      return { ...prev, [gradeKey]: { ...g, courses } };
    });
  };

  const removeCourse = (gradeKey: string, courseId: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const courses = g.courses.filter((c: any) => c.id !== courseId);
      // also remove any assignment entries
      const assignments = { ...(g.assignments || {}) } as Record<string, Record<string,string>>;
      Object.keys(assignments).forEach(sec => { if (assignments[sec] && assignments[sec][courseId]) delete assignments[sec][courseId]; });
      return { ...prev, [gradeKey]: { ...g, courses, assignments } };
    });
  };

  const toggleCourseForSection = (gradeKey: string, sectionName: string, courseId: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const assignments = { ...(g.assignments || {}) } as Record<string, Record<string,string>>;
      if (!assignments[sectionName]) assignments[sectionName] = {};
      if (assignments[sectionName][courseId] !== undefined) {
        // toggle off
        delete assignments[sectionName][courseId];
      } else {
        // toggle on with empty teacher
        assignments[sectionName][courseId] = '';
      }
      return { ...prev, [gradeKey]: { ...g, assignments } };
    });
  };

  const assignTeacherForSectionCourse = (gradeKey: string, sectionName: string, courseId: string, teacherId: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const assignments = { ...(g.assignments || {}) } as Record<string, Record<string,string>>;
      if (!assignments[sectionName]) assignments[sectionName] = {};
      assignments[sectionName][courseId] = teacherId;
      return { ...prev, [gradeKey]: { ...g, assignments } };
    });
  };

  const toggleGradeCollapsed = (gradeKey: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      if (!g) return prev;
      const nextCollapsed = !g.collapsed;
      if (!nextCollapsed) {
        const next: typeof prev = {} as typeof prev;
        Object.keys(prev).forEach(key => {
          next[key] = { ...prev[key], collapsed: key === gradeKey ? false : true };
        });
        return next;
      }
      return { ...prev, [gradeKey]: { ...g, collapsed: true } };
    });
  };

  const removeGrade = (gradeKey: string) => {
    const shouldRemove = window.confirm('Delete this grade and all its courses/sections?');
    if (!shouldRemove) return;

    setGradeMap(prev => {
      const next = { ...prev };
      delete next[gradeKey];
      return next;
    });
  };

  const handleSave = async () => {
    // Flatten to structure rows
    const rows: StructureRow[] = [];
    for (const gradeKey of Object.keys(gradeMap)) {
      const g = gradeMap[gradeKey];
      const matchGradeLabel = (g.displayName || gradeKey).toString();
      const assignments = g.assignments || {};
      // for each section for this grade
      for (const sectionName of Object.keys(assignments)) {
        const courseMap = assignments[sectionName] || {};
        for (const courseId of Object.keys(courseMap)) {
          const teacherId = courseMap[courseId] || '';
          const course = (g.courses || []).find((c: any) => c.id === courseId);
          if (!course) continue;
          // find classId matching this grade display name and section
          const cls = classes.find(c => {
            const { grade, section } = parseClassName(c.name || '');
            return grade === matchGradeLabel && (section === sectionName || c.section === sectionName);
          });
          if (!cls) continue;
          rows.push({ id: Date.now().toString() + Math.random().toString(36).slice(2,6), classId: cls.id, teacherId, subject: course.name || '', sessionsPerWeek: course.sessionsPerWeek || 3 });
        }
      }
    }

    try {
      setSaving(true);
      await onSave(rows);
    } catch (err) {
      console.error('Failed to save structure rows:', err);
      alert('Failed to save timetable structure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black">Timetable Structure Editor</h4>
          <p className="text-xs text-slate-500">Create grades, add courses, select sections and assign teachers.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Grade number (e.g. 10) or name"
            value={newGradeInput}
            onChange={(e) => setNewGradeInput(e.target.value)}
            className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm w-40"
          />
          <button onClick={() => addGrade(newGradeInput)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Add Grade</button>
        </div>
      </div>

      <div ref={containerRef} className="space-y-4 max-h-[520px] overflow-y-auto pr-2 pb-4">
        {Object.keys(gradeMap).length === 0 && (
          <div className="p-6 border border-dashed rounded-lg text-center">No grades detected. Add a grade to begin.</div>
        )}

        {Object.entries(gradeMap).map(([gradeKey, g]) => (
          <div key={gradeKey} className="p-4 bg-white dark:bg-slate-800 border rounded-xl">
            <div className="flex items-center justify-between mb-3 gap-4">
              <div className="flex-1">
                <input
                  value={g.displayName || ''}
                  onChange={(e) => updateGradeDisplayName(gradeKey, e.target.value)}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (/^\d+$/.test(v)) updateGradeDisplayName(gradeKey, `Grade ${v}`);
                  }}
                  className="font-bold text-lg w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <p className="text-xs text-slate-500">Sections: {g.sections.map(s=>s.name).join(', ') || 'none'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => addSection(gradeKey)} className="px-3 py-1 bg-slate-700 text-white rounded-md text-sm">Add Section</button>
                <button onClick={() => addCourse(gradeKey)} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Add Course</button>
                <button onClick={() => toggleGradeCollapsed(gradeKey)} className="px-3 py-1 border rounded-md text-sm">{g.collapsed ? 'Expand' : 'Collapse'}</button>
                <button onClick={() => removeGrade(gradeKey)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Delete</button>
              </div>
            </div>

            {!g.collapsed && (
              <div className="space-y-3">
              {g.courses.length === 0 && (
                <div className="text-sm text-slate-500">No courses yet for this grade.</div>
              )}

              <div className="space-y-2">
                {g.courses.map((course: any) => (
                  <div key={course.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-black">Course Name</label>
                      <input value={course.name} onChange={(e) => updateCourse(gradeKey, course.id, { name: e.target.value })} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none" />
                    </div>
                    <div className="w-40">
                      <label className="text-xs font-black">Sessions / Week</label>
                      <input type="number" min={1} max={10} value={course.sessionsPerWeek} onChange={(e) => updateCourse(gradeKey, course.id, { sessionsPerWeek: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none" />
                    </div>
                    <div>
                      <button onClick={() => removeCourse(gradeKey, course.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-xs font-black">Section Assignments</label>
                <div className="space-y-3 mt-2">
                  {(g.sections && g.sections.length>0) ? g.sections.map((s:any) => (
                    <div key={s.name} className="p-3 bg-white dark:bg-slate-800 rounded-md border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold whitespace-nowrap">Section</span>
                        <input
                          value={s.name}
                          onChange={(e) => updateSectionName(gradeKey, s.name, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none"
                        />
                        <button
                          onClick={() => removeSection(gradeKey, s.name)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {g.courses.map((course:any) => {
                          const assigned = !!(g.assignments && g.assignments[s.name] && g.assignments[s.name][course.id] !== undefined);
                          return (
                            <div key={course.id} className="w-full sm:w-1/2 lg:w-1/3">
                              <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md w-full">
                                <input type="checkbox" checked={assigned} onChange={() => toggleCourseForSection(gradeKey, s.name, course.id)} />
                                <div className="flex-1 text-sm">{course.name || 'Untitled Course'}</div>
                              </label>
                              {assigned && (
                                <div className="mt-2">
                                  <select value={(g.assignments?.[s.name]?.[course.id]) || ''} onChange={(e) => assignTeacherForSectionCourse(gradeKey, s.name, course.id, e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none mt-1">
                                    <option value="">Select teacher</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )) : <div className="text-sm text-slate-500">No sections available for this grade</div>}
                </div>
              </div>
            </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl">{saving ? 'Saving...' : 'Save Structure'}</button>
      </div>
    </div>
  );
};

export default TimetableStructureEditor;
