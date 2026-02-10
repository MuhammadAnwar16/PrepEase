import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Search, Loader, GraduationCap, Edit2 } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const MAIN_DEPARTMENT = 'Information and Technology';
const SUB_DEPARTMENTS = [
  'Bachelor of IT',
  'Bachelor of Computer Science',
  'Bachelor of Software Engineering',
];

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: MAIN_DEPARTMENT,
    semester: '',
    subjects: '',
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: MAIN_DEPARTMENT,
    semester: '',
    subjects: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/users?limit=100');
      const allUsers = response.data.users || [];
      setStudents(allUsers.filter((u: any) => u.role === 'Student'));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (!formData.department || !formData.semester || !formData.subjects) {
      setError('Department, semester, and subjects are required');
      return;
    }

    try {
      const subjects = formData.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await axiosInstance.post('/admin/create-user', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: 'Student',
        department: formData.department,
        semester: formData.semester,
        subjects,
      });
      setSuccess('Student account created successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: '',
        semester: '',
        subjects: '',
      });
      setShowCreateModal(false);
      fetchStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create student');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student account?')) return;

    try {
      await axiosInstance.delete(`/admin/users/${studentId}`);
      setSuccess('Student deleted successfully');
      fetchStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      password: '',
      department: MAIN_DEPARTMENT,
      semester: student.semester || '',
      subjects: Array.isArray(student.subjects) ? student.subjects[0] || '' : '',
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?._id) return;

    setError('');
    setSuccess('');

    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        department: editFormData.department,
        semester: editFormData.semester,
        subjects: editFormData.subjects ? [editFormData.subjects] : [],
      };

      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      await axiosInstance.put(`/admin/users/${editingStudent._id}`, payload);
      setSuccess('Student updated successfully');
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update student');
    }
  };

  const filteredStudents = students.filter((student) =>
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="text-stone-900" strokeWidth={1.5} size={32} />
            <h1 className="text-3xl font-serif font-bold text-stone-900">Student Management</h1>
          </div>
          <p className="text-stone-600 font-sans">Create, manage, and delete student accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm hover:bg-emerald-700 transition"
        >
          <Plus size={20} strokeWidth={1.5} /> Create Student
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
        <Search className="absolute left-3 top-3 text-stone-400" strokeWidth={1.5} size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
        />
      </div>

      <div className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-stone-900" strokeWidth={1.5} size={32} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-stone-100 text-stone-500 text-xs uppercase font-bold border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-mono tracking-widest">Name</th>
                <th className="px-6 py-4 font-mono tracking-widest">Email</th>
                <th className="px-6 py-4 font-mono tracking-widest">Department</th>
                <th className="px-6 py-4 font-mono tracking-widest">Semester</th>
                <th className="px-6 py-4 font-mono tracking-widest">Subjects</th>
                <th className="px-6 py-4 font-mono tracking-widest">Enrolled</th>
                <th className="px-6 py-4 text-right font-mono tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-stone-100 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900 font-sans">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-sans">{student.email}</td>
                    <td className="px-6 py-4 text-stone-600 font-sans">{student.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-stone-600 font-sans">{student.semester || 'N/A'}</td>
                    <td className="px-6 py-4 text-stone-600 text-sm font-sans">
                      {(student.subjects || []).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm font-sans">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-2 text-stone-700 hover:bg-stone-100 rounded-sm transition"
                        title="Edit student"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-sm transition"
                        title="Delete student"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-500 font-sans">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Create New Student</h2>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Department</label>
                <input
                  type="text"
                  value={MAIN_DEPARTMENT}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Semester</label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="e.g., Fall 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Sub Department</label>
                <select
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                >
                  <option value="">Select sub department</option>
                  {SUB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-900 rounded-sm hover:bg-stone-100 transition font-sans font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Edit Student</h2>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">First Name</label>
                <input
                  type="text"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Password</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Department</label>
                <input
                  type="text"
                  value={MAIN_DEPARTMENT}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Semester</label>
                <input
                  type="text"
                  value={editFormData.semester}
                  onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="e.g., Fall 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Sub Department</label>
                <select
                  value={editFormData.subjects}
                  onChange={(e) => setEditFormData({ ...editFormData, subjects: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                >
                  <option value="">Select sub department</option>
                  {SUB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-900 rounded-sm hover:bg-stone-100 transition font-sans font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
