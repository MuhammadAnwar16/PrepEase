import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, ArrowLeft, Loader } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface Course {
  _id: string;
  courseCode?: string;
  title?: string;
}

interface EnrollmentData {
  _id: string;
  course: Course;
}

interface AssignmentDetail {
  assessmentId: string;
  title: string;
  dueDate: string | null;
  totalMarks: number;
  submitted: boolean;
  submittedAt: string | null;
  score: number | null;
  gradedAt: string | null;
  feedback: string;
  status: 'pending' | 'submitted' | 'graded';
}

interface QuizDetail {
  quizId: string;
  title: string;
  passingScore: number;
  questionCount: number;
  attemptsCount: number;
  latestScore: number | null;
  latestStatus: 'passed' | 'failed' | null;
  latestCompletedAt: string | null;
}

interface SummaryData {
  assignmentTotal: number;
  assignmentSubmitted: number;
  averageAssignmentScore: number;
  quizAttempts: number;
  averageQuizScore: number;
  performanceScore: number;
}

const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/enrollments/my-courses');
        const enrollments: EnrollmentData[] = response.data.enrollments || [];
        const courseList = enrollments.map((e) => e.course).filter(Boolean) as Course[];
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0]._id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load your courses');
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!selectedCourse) return;
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/enrollments/my-course/${selectedCourse}/details`);
        setSummary(response.data.summary || null);
        setAssignments(response.data.assignments || []);
        setQuizzes(response.data.quizzes || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load performance data');
        setSummary(null);
        setAssignments([]);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [selectedCourse]);

  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Assignments', score: summary.averageAssignmentScore || 0 },
      { name: 'Quizzes', score: summary.averageQuizScore || 0 },
      { name: 'Overall', score: summary.performanceScore || 0 },
    ];
  }, [summary]);

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-stone-100 rounded-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Performance Analytics</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Progress & Insights</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
        <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans text-stone-900"
        >
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseCode ? `${course.courseCode} - ` : ''}{course.title || 'Untitled Course'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 text-rose-700 text-sm font-sans">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
            <h3 className="font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight text-lg">
                <TrendingUp className="text-stone-900" size={20} strokeWidth={1.5} /> Subject Proficiency
            </h3>
            <div className="h-64">
                {loading ? (
                  <div className="flex items-center gap-2 text-stone-500 font-sans">
                    <Loader size={16} className="animate-spin" /> Loading performance...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 500}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 500}} />
                          <Tooltip 
                              contentStyle={{ borderRadius: '2px', border: '1px solid #e7e5e4', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} 
                              cursor={{ fill: '#f5f5f4' }}
                              formatter={(value) => [`${value}%`, 'Score']}
                          />
                          <Bar dataKey="score" fill="#1c1917" radius={[2, 2, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
            <h3 className="font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight text-lg">
                <AlertTriangle className="text-stone-900" size={20} strokeWidth={1.5} /> Performance Summary
            </h3>
            <p className="text-sm text-stone-500 mb-4 font-sans">Course metrics overview:</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Assignments Submitted</span>
                <span className="font-bold text-stone-900">
                  {summary?.assignmentSubmitted ?? 0}/{summary?.assignmentTotal ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Average Assignment Score</span>
                <span className="font-bold text-stone-900">{summary?.averageAssignmentScore ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Quiz Attempts</span>
                <span className="font-bold text-stone-900">{summary?.quizAttempts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Average Quiz Score</span>
                <span className="font-bold text-stone-900">{summary?.averageQuizScore ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between font-sans border-t border-stone-200 pt-3">
                <span className="text-stone-700 font-bold">Overall Performance</span>
                <span className="font-bold text-stone-900 text-base">{summary?.performanceScore ?? 0}%</span>
              </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
          <h3 className="font-serif font-bold text-stone-900 mb-4 tracking-tight text-lg">Assignments</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-stone-500 font-sans">
              <Loader size={16} className="animate-spin" /> Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-sm text-stone-500 font-sans">No assignments found.</div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.assessmentId} className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-sans font-semibold text-stone-900 text-sm">{assignment.title}</p>
                      <p className="text-xs text-stone-500 font-sans">
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-sm text-xs font-mono font-bold ${
                        assignment.status === 'graded'
                          ? 'border border-emerald-700 text-emerald-700'
                          : assignment.status === 'submitted'
                            ? 'border border-stone-900 text-stone-900'
                            : 'border border-stone-400 text-stone-400'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 font-sans flex flex-wrap gap-3">
                    <span>Marks: {assignment.score ?? 'N/A'} / {assignment.totalMarks}</span>
                    <span>Submitted: {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : 'No'}</span>
                  </div>
                  {assignment.feedback && (
                    <div className="mt-3 text-xs text-stone-700 font-sans">
                      <span className="font-semibold">Feedback:</span> {assignment.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
          <h3 className="font-serif font-bold text-stone-900 mb-4 tracking-tight text-lg">Quizzes</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-stone-500 font-sans">
              <Loader size={16} className="animate-spin" /> Loading quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-sm text-stone-500 font-sans">No quizzes found.</div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.quizId} className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-sans font-semibold text-stone-900 text-sm">{quiz.title}</p>
                      <p className="text-xs text-stone-500 font-sans">Attempts: {quiz.attemptsCount}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-sm text-xs font-mono font-bold ${
                        quiz.latestStatus === 'passed'
                          ? 'border border-emerald-700 text-emerald-700'
                          : quiz.latestStatus === 'failed'
                            ? 'border border-rose-700 text-rose-700'
                            : 'border border-stone-400 text-stone-400'
                      }`}
                    >
                      {quiz.latestStatus || 'not attempted'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 font-sans flex flex-wrap gap-3">
                    <span>Latest Score: {quiz.latestScore ?? 'N/A'}%</span>
                    <span>Questions: {quiz.questionCount}</span>
                    <span>Completed: {quiz.latestCompletedAt ? new Date(quiz.latestCompletedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;