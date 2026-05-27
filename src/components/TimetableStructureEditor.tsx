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
  const [gradeMap, setGradeMap] = useState<Record<string, { displayName?: string; sections: { name: string; classId?: string }[]; courses: any[] }>>({});
  const [saving, setSaving] = useState(false);
  const [newGradeInput, setNewGradeInput] = useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const map: Record<string, { displayName?: string; sections: { name: string; classId?: string }[]; courses: any[] }> = {};
    classes.forEach(c => {
      const { grade, section } = parseClassName(c.name || '');
      if (!map[grade]) map[grade] = { sections: [], courses: [] };
      if (section) map[grade].sections.push({ name: section, classId: c.id });
      else map[grade].sections.push({ name: c.section || 'A', classId: c.id });
      // set display name to friendly grade label
      map[grade].displayName = grade;
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

  const addCourse = (gradeKey: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const id = Date.now().toString();
      const course = { id, name: '', sessionsPerWeek: 3, sectionsSelected: [] as string[], teacherBySection: {} as Record<string,string> };
      const updated = { ...prev, [gradeKey]: { ...g, courses: [...g.courses, course] } };
      return updated;
    });
    // ensure scroll to bottom so new course is visible
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 80);
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
      return { ...prev, [gradeKey]: { ...g, courses } };
    });
  };

  const toggleSectionForCourse = (gradeKey: string, courseId: string, sectionName: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const courses = g.courses.map((c: any) => {
        if (c.id !== courseId) return c;
        const set = new Set(c.sectionsSelected || []);
        if (set.has(sectionName)) set.delete(sectionName); else set.add(sectionName);
        return { ...c, sectionsSelected: Array.from(set) };
      });
      return { ...prev, [gradeKey]: { ...g, courses } };
    });
  };

  const assignTeacher = (gradeKey: string, courseId: string, sectionName: string, teacherId: string) => {
    setGradeMap(prev => {
      const g = prev[gradeKey];
      const courses = g.courses.map((c: any) => {
        if (c.id !== courseId) return c;
        const by = { ...(c.teacherBySection || {}) } as Record<string,string>;
        by[sectionName] = teacherId;
        return { ...c, teacherBySection: by };
      });
      return { ...prev, [gradeKey]: { ...g, courses } };
    });
  };

  const handleSave = async () => {
    // Flatten to structure rows
    const rows: StructureRow[] = [];
    for (const gradeKey of Object.keys(gradeMap)) {
        const g = gradeMap[gradeKey];
        const matchGradeLabel = (g.displayName || gradeKey).toString();
        for (const course of g.courses) {
          for (const sectionName of course.sectionsSelected || []) {
            // find classId matching this grade display name and section
            const cls = classes.find(c => {
              const { grade, section } = parseClassName(c.name || '');
              return grade === matchGradeLabel && (section === sectionName || c.section === sectionName);
            });
          if (!cls) continue; // cannot map
          const teacherId = (course.teacherBySection || {})[sectionName] || '';
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
            className="px-3 py-1 rounded-md border bg-white dark:bg-slate-800 text-sm w-40"
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
                  className="font-bold text-lg w-full px-2 py-1 rounded-md border"
                />
                <p className="text-xs text-slate-500">Sections: {g.sections.map(s=>s.name).join(', ') || 'none'}</p>
              </div>
              <div>
                <button onClick={() => addCourse(gradeKey)} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Add Course</button>
              </div>
            </div>

            <div className="space-y-3">
              {g.courses.length === 0 && (
                <div className="text-sm text-slate-500">No courses yet for this grade.</div>
              )}

              {g.courses.map((course: any) => (
                <div key={course.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs font-black">Course Name</label>
                      <input value={course.name} onChange={(e) => updateCourse(gradeKey, course.id, { name: e.target.value })} className="w-full px-3 py-2 rounded-md" />
                    </div>
                    <div>
                      <label className="text-xs font-black">Sessions / Week</label>
                      <input type="number" min={1} max={10} value={course.sessionsPerWeek} onChange={(e) => updateCourse(gradeKey, course.id, { sessionsPerWeek: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md" />
                    </div>
                    <div className="text-right">
                      <button onClick={() => removeCourse(gradeKey, course.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Remove</button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-black">Sections</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(g.sections && g.sections.length>0) ? g.sections.map((s:any) => {
                        const checked = (course.sectionsSelected||[]).includes(s.name);
                        return (
                          <label key={s.name} className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border rounded-md">
                            <input type="checkbox" checked={checked} onChange={() => toggleSectionForCourse(gradeKey, course.id, s.name)} />
                            <span>{s.name}</span>
                          </label>
                        );
                      }) : <div className="text-sm text-slate-500">No sections available for this grade</div>}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-black">Assign Teachers (per section)</label>
                    <div className="space-y-2 mt-2">
                      {(course.sectionsSelected||[]).length === 0 && <div className="text-sm text-slate-500">No sections selected</div>}
                      {(course.sectionsSelected||[]).map((sname: string) => (
                        <div key={sname} className="flex items-center gap-3">
                          <div className="w-24 text-sm">{sname}</div>
                          <select value={course.teacherBySection?.[sname] || ''} onChange={(e) => assignTeacher(gradeKey, course.id, sname, e.target.value)} className="flex-1 px-3 py-2 rounded-md">
                            <option value="">Select teacher</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
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
