# Course Management & Lecture Upload Implementation

## Overview
Complete course management system where:
- **Only Admins** can create, update, delete courses and assign teachers
- **Only Teachers** with assigned courses can upload lectures
- Teachers cannot modify courses - only upload materials

---

## Backend Implementation

### 1. Course Model Updates
**File:** `backend/models/Course.js`

**Changes:**
- Changed `teacher` (single reference) to `teachers` (array of teachers)
- Added fields: `description`, `credits`, `semester`, `year`, `isActive`
- Supports multiple teachers per course

**Schema:**
```javascript
{
  courseCode: String (unique),
  title: String,
  description: String,
  teachers: [ObjectId], // Array of teacher references
  credits: Number (default: 3),
  semester: String (Fall/Spring/Summer),
  year: Number,
  isActive: Boolean (default: true),
  timestamps: true
}
```

### 2. Course Controller Updates
**File:** `backend/controllers/courseController.js`

**New Admin Functions:**
- `createCourse()` - Create new course (admin only)
- `getAllCourses()` - List all courses with populated teachers
- `getCourseById()` - Get course details
- `updateCourse()` - Update course info (admin only)
- `deleteCourse()` - Delete course (admin only)
- `assignTeacherToCourse()` - Add teacher to course (admin only)
- `removeTeacherFromCourse()` - Remove teacher from course (admin only)

**New Teacher Functions:**
- `getMyAssignedCourses()` - Get courses assigned to logged-in teacher

### 3. Course Routes Updates
**File:** `backend/routes/courseRoutes.js`

**Admin Routes:**
- `POST /courses` - Create course
- `GET /courses` - List all courses
- `GET /courses/id/:id` - Get course details
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `POST /courses/:courseId/assign-teacher` - Assign teacher
- `DELETE /courses/:courseId/teacher/:teacherId` - Remove teacher

**Teacher Routes:**
- `GET /courses/teacher/my-courses` - Get assigned courses

### 4. CourseMaterial Model Updates
**File:** `backend/models/CourseMaterial.js`

**New Fields:**
- `materialType`: 'lecture' | 'resource' | 'assignment' (default: 'lecture')
- `uploadedBy`: ObjectId reference to User (teacher who uploaded)

### 5. Material Controller Updates
**File:** `backend/controllers/materialController.js`

**Authorization:**
- Teachers can only upload to their assigned courses
- Automatic verification via `course.teachers.includes(userId)`
- Added `materialType: 'lecture'` and `uploadedBy: userId` to uploads

**Error Handling:**
- Returns 403 if teacher tries to upload to course they're not assigned to
- Clear error message: "You are not assigned to this course..."

---

## Frontend Implementation

### 1. Admin Course Management Page
**File:** `PrepEase/pages/admin/CourseManagement.tsx`

**Features:**
- Create courses with: courseCode, title, description, credits, semester, year
- Search courses by code or title
- View all courses with assigned teachers
- Assign multiple teachers to courses
- Remove teachers from courses
- Delete courses with confirmation
- Real-time updates via API

**UI Components:**
- Course creation modal
- Teacher assignment modal
- Course cards showing:
  - Course code and title
  - Description
  - Credits, semester, year, status
  - List of assigned teachers with remove buttons
  - Delete button

### 2. Teacher Lecture Upload Page
**File:** `PrepEase/pages/teacher/LectureUpload.tsx`

**Features:**
- Displays only courses assigned to logged-in teacher
- Upload lectures for assigned courses
- Select course from dropdown
- Upload PDF or PPT files
- Lecture title input
- Drag-and-drop file upload area
- File type validation (PDF, PPT only)

**Lecture Management:**
- View all lectures for selected course
- Delete lectures with confirmation
- Show lecture upload status (Pending/Processing/Ready)
- Display file type and upload date
- Real-time list updates

### 3. Routing Updates
**File:** `PrepEase/src/App.jsx`

**New Routes:**
- Admin: `/admin/courses` → CourseManagement page
- Teacher: `/teacher/lectures` → LectureUpload page

### 4. AdminLayout Updates
**File:** `PrepEase/src/components/AdminLayout.jsx`

**Sidebar Changes:**
- Added "Courses" link under "Academic" section
- Updated page title logic to show "Course Management"

**Navigation:**
- Dashboard
- **Management:** Students, Teachers, All Users
- **Academic:** Courses (NEW)
- **System:** Settings

### 5. TeacherLayout Updates
**File:** `PrepEase/src/components/TeacherLayout.jsx`

**Sidebar Changes:**
- Renamed "Course Materials" to "Upload Lectures"
- Removed old "Upload Materials" link
- New route: `/teacher/lectures`

**Navigation:**
- Dashboard
- **Management:**
  - Upload Lectures (NEW - for assigned courses)
  - Course Materials (existing)
  - Create Assessment
  - Class Analytics

---

## User Workflows

### Admin Workflow: Course Setup
1. Navigate to `/admin/courses` from sidebar
2. Click "Create Course" button
3. Fill in: Course Code, Title, Description, Credits, Semester
4. Submit to create course
5. Click "Assign Teachers" on course card
6. Select teacher from dropdown
7. Click "Assign Teacher" to add
8. Repeat step 5-7 to assign multiple teachers
9. Can remove teachers with ✕ button
10. Can delete courses with trash icon

### Teacher Workflow: Upload Lectures
1. Admin assigns teacher to courses
2. Teacher navigates to `/teacher/lectures`
3. System auto-loads assigned courses
4. Select course from dropdown
5. Enter lecture title
6. Click upload area or drag-drop PDF/PPT file
7. Click "Upload Lecture" button
8. View uploaded lectures in right panel
9. Delete lectures if needed
10. Lectures ready for students to access

### Authorization Rules

**Course Management:**
- ✅ Admin: Create, read, update, delete courses
- ✅ Admin: Assign/remove teachers to/from courses
- ❌ Teacher: Cannot create or manage courses
- ❌ Student: Cannot access course management

**Lecture Upload:**
- ✅ Teacher: Upload only to assigned courses
- ❌ Teacher: Cannot upload to unassigned courses
- ❌ Teacher: Cannot modify course details
- ❌ Admin: Cannot upload lectures (requires teacher assignment)
- ❌ Student: Cannot upload lectures

---

## API Endpoints Summary

### Courses
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/courses` | Admin | Create course |
| GET | `/courses` | All Auth | List all courses |
| GET | `/courses/id/:id` | All Auth | Get course details |
| PUT | `/courses/:id` | Admin | Update course |
| DELETE | `/courses/:id` | Admin | Delete course |
| POST | `/courses/:courseId/assign-teacher` | Admin | Assign teacher |
| DELETE | `/courses/:courseId/teacher/:teacherId` | Admin | Remove teacher |
| GET | `/courses/teacher/my-courses` | Teacher | Get assigned courses |

### Materials (Lectures)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/materials/upload` | Teacher | Upload lecture (checks course assignment) |
| GET | `/materials/course/:courseId` | Auth | Get course materials |
| DELETE | `/materials/:id` | Teacher | Delete own lecture |

---

## Error Handling

### Teacher Upload Errors
- **No course selected:** "Please select a course"
- **No title provided:** "Lecture title is required"
- **No file selected:** "Please select a file"
- **Not assigned to course:** "You are not assigned to this course. Contact your administrator."
- **Invalid file type:** "Only PDF and PPT files are allowed"

### Course Management Errors
- **Duplicate course code:** "Course code already exists"
- **Teacher not found:** "Teacher not found"
- **Already assigned:** "Teacher already assigned to this course"
- **Invalid course:** "Course not found"

---

## Data Validation

**Course Creation:**
- courseCode: Required, unique, trimmed
- title: Required, trimmed
- credits: 1-4 (default: 3)
- semester: Fall/Spring/Summer
- year: Auto-set to current year

**Teacher Assignment:**
- Must be valid Teacher role
- Cannot assign same teacher twice
- Can assign multiple teachers

**Lecture Upload:**
- courseId: Required
- title: Required
- file: Required (PDF/PPT only)
- File size: Standard multer defaults
- Teacher must be assigned to course

---

## File Organization

```
Backend:
- models/Course.js (updated)
- models/CourseMaterial.js (updated)
- controllers/courseController.js (updated)
- routes/courseRoutes.js (updated)
- controllers/materialController.js (updated)

Frontend:
- pages/admin/CourseManagement.tsx (NEW)
- pages/teacher/LectureUpload.tsx (NEW)
- src/App.jsx (updated)
- src/components/AdminLayout.jsx (updated)
- src/components/TeacherLayout.jsx (updated)
```

---

## Testing Checklist

- [ ] Admin can create courses
- [ ] Admin can assign multiple teachers to course
- [ ] Admin can remove teachers from course
- [ ] Admin can delete courses
- [ ] Teacher sees only assigned courses
- [ ] Teacher can upload lectures to assigned courses
- [ ] Teacher cannot upload to unassigned courses
- [ ] Teacher can delete own lectures
- [ ] Course code uniqueness enforced
- [ ] Duplicate teacher assignment prevented
- [ ] File type validation works
- [ ] Error messages display correctly
- [ ] Navigation links work in sidebars
- [ ] Page titles update correctly
