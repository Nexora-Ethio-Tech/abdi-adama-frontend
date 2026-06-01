import React from 'react';
import logo from '../assets/logo.jpg';

export interface TranscriptSubjectRow {
  name: string;
  mark: string | number;
  grade: string;
}

export interface TranscriptTemplateData {
  name: string;
  id: string;
  academicYear: string;
  semester: string;
  subjects: TranscriptSubjectRow[];
  average: string | number;
  rank: string | number;
}

interface TranscriptTemplateProps {
  studentData: TranscriptTemplateData;
}

export const TranscriptTemplate = ({ studentData }: TranscriptTemplateProps) => {
  const subjects = studentData.subjects.length > 0
    ? studentData.subjects
    : [{ name: 'No grades found', mark: 0, grade: '0' }];

  const average = studentData.average ?? 0;
  const rank = studentData.rank ?? 0;

  return (
    <div className="max-w-[210mm] min-h-[297mm] mx-auto p-12 bg-white text-gray-900 border-2 border-double border-gray-300 shadow-2xl print:shadow-none print:border-0 print:max-w-none print:min-h-0">
      <div className="flex flex-col items-center mb-8 border-b-4 border-blue-900 pb-6">
        <img src={logo} alt="Abdi Adama School Logo" className="w-32 h-32 mb-4 object-contain" />
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-wider text-center">MANA BARUMSAA ABDII ADAAMAA</h1>
        <h2 className="text-xl font-semibold text-gray-700 text-center">ABDI ADAMA SCHOOL</h2>
        <p className="mt-2 text-sm italic font-medium text-center">"Excellence in Education & Integrity"</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <p><span className="font-bold text-gray-600">Student Name:</span> {studentData.name || 'N/A'}</p>
          <p><span className="font-bold text-gray-600">Student ID:</span> {studentData.id || 'N/A'}</p>
        </div>
        <div className="space-y-2">
          <p><span className="font-bold text-gray-600">Academic Year:</span> {studentData.academicYear || 'N/A'}</p>
          <p><span className="font-bold text-gray-600">Semester:</span> {studentData.semester || 'N/A'}</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse mb-10">
        <thead>
          <tr className="bg-blue-900 text-white uppercase text-sm">
            <th className="p-3 border">Subject Name</th>
            <th className="p-3 border text-center">Score (100%)</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject, index) => (
            <tr key={`${subject.name}-${index}`} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="p-3 border font-medium">{subject.name}</td>
              <td className="p-3 border text-center">{subject.mark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-start border-t-2 pt-6 gap-6">
        <div className="space-y-2">
          <p className="text-lg"><strong>Average Score:</strong> {average}%</p>
          <p className="text-lg"><strong>Final Rank:</strong> {rank}</p>
        </div>
        <div className="text-center w-48 shrink-0">
          <div className="h-16 border-b border-gray-400 mb-2"></div>
          <p className="text-sm font-bold">Principal Signature</p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptTemplate;