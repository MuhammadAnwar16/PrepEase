import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Search, Loader, BookOpen, Edit2, Users } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    description: '',
    credits: 3,
    semester: 'Fall',
    year: new Date().getFullYear(),
  });

  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/courses');
      setCourses(response.data.courses || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get('/admin/users?limit=1000');
      const allUsers = response.data.users || [];
      setTeachers(allUsers.filter((u: any) => u.role === 'Teacher'));
    } catch (err: any) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.courseCode || !formData.title) {
      setError('Course code and title are required');
      return;
    }

    try {
      await axiosInstance.post('/courses', formData);
      setSuccess('Course created successfully!');
      setFormData({
        courseCode: '',
        title: '',
        description: '',
        credits: 3,
        semester: 'Fall',
        year: new Date().getFullYear(),
      });
      setShowCreateModal(false);
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create course');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeacher) {
      setError('Please select a teacher');
      return;
    }

    try {
      await axiosInstance.post(`/courses/${selectedCourse._id}/assign-teacher`, {
        teacherId: selectedTeacher,
      });
      setSuccess('Teacher assigned successfully!');
      setShowAssignModal(false);
      setSelectedTeacher('');
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async (courseId: string, teacherId: string) => {
    if (!window.confirm('Remove this teacher from the course?')) return;

    setError('');
    setSuccess('');

    try {
      await axiosInstance.delete(`/courses/${courseId}/teacher/${teacherId}`);
      setSuccess('Teacher removed successfully');
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove teacher');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    setError('');
    setSuccess('');

    try {
      await axiosInstance.delete(`/courses/${courseId}`);
      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete course');
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-stone-900" size={32} strokeWidth={1.5} />
            <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Course Management</h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Create courses and assign teachers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
        >
          <Plus size={20} strokeWidth={1.5} /> Create Course
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm font-sans">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-sm font-sans">
          ✅ {success}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-stone-400" size={20} strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search by course code or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-purple-600" size={32} />
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div key={course._id} className="border border-stone-200 rounded-sm p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-sans font-bold text-stone-900">{course.title}</h3>
                        <span className="border border-stone-900 text-stone-900 px-2 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-widest">
                          {course.courseCode}
                        </span>
                      </div>
                      {course.description && (
                        <p className="text-stone-600 text-sm mb-2 font-sans">{course.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-stone-500 font-sans">
                        <span>Credits: {course.credits}</span>
                        <span>{course.semester} {course.year}</span>
                        <span>{course.isActive ? '✅ Active' : '❌ Inactive'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowAssignModal(true);
                        }}
                        className="p-2 text-stone-900 hover:bg-stone-100 rounded-sm transition"
                        title="Assign teacher"
                      >
                        <Users size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-sm transition"
                        title="Delete course"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Teachers List */}
                  {course.teachers && course.teachers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Assigned Teachers:</p>
                      <div className="flex flex-wrap gap-2">
                        {course.teachers.map((teacher: any) => (
                          <div
                            key={teacher._id}
                            className="border border-stone-900 text-stone-900 rounded-sm px-3 py-1 flex items-center justify-between gap-2"
                          >
                            <span className="text-sm font-sans">
                              {teacher.firstName} {teacher.lastName}
                            </span>
                            <button
                              onClick={() => handleRemoveTeacher(course._id, teacher._id)}
                              className="text-stone-900 hover:text-rose-700 transition font-bold"
                              title="Remove teacher"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-500 font-sans">
                No courses found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 tracking-tight">Create New Course</h2>

            <form onSubmit={handleCreateCourse} className="space-y-4 font-sans">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Course Code</label>
                <input
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                  placeholder="CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                  placeholder="Introduction to Programming"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                  placeholder="Course description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-sm hover:bg-stone-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-semibold"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2 tracking-tight">Assign Teacher</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Course: {selectedCourse.title}</p>

            <form onSubmit={handleAssignTeacher} className="space-y-4 font-sans">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Select Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none"
                >
                  <option value="">Choose a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTeacher('');
                  }}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-sm hover:bg-stone-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-semibold"
                >
                  Assign Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
