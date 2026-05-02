# Student Course Management - Per-Student Implementation

## Overview
Implemented admin-controlled course visibility on a **per-student basis**. Admins can now assign specific courses to individual students from the student management interface. Students see only the courses assigned to them by the admin.

## Key Difference from Previous Approach
- **Previous:** Global course-level visibility (all students see the same available courses)
- **Current:** Individual per-student assignment (each student gets their own course list)

## Changes Made

### 1. Backend - User Model
**File:** `backend/models/User.js`

Added new field to track available courses per student:
```javascript
availableCourses: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
]
```

- **Type:** Array of Course ObjectIds
- **Purpose:** Tracks which courses each student can access
- **Default:** Empty array (no courses until admin assigns them)

### 2. Backend - Course Model
**File:** `backend/models/Course.js`

Removed global availability field - using per-student assignment instead.

### 3. Backend - Course Controller
**File:** `backend/controllers/courseController.js`

#### Updated: `getAllCourses()`
```javascript
if (req.user.role === "Student") {
  // Students see only courses in their availableCourses array
  const student = await User.findById(req.user._id);
  if (!student || !student.availableCourses) {
    return res.status(200).json({ courses: [] });
  }
  courses = await Course.find({ _id: { $in: student.availableCourses } })
    .populate("teachers", "firstName lastName email")
    .sort({ department: 1, programSemester: 1, courseCode: 1 })
    .lean();
}
```

#### New Function: `assignCoursesToStudent()`
```
POST /courses/assign-to-student/:studentId
Auth: Admin only
Body: { courseIds: ["id1", "id2", ...] }
```

- Accepts array of course IDs to assign
- Replaces student's `availableCourses` array
- Returns updated student with populated courses
- Validates that target is actually a student

### 4. Backend - Course Routes
**File:** `backend/routes/courseRoutes.js`

Added new route:
```javascript
router.post("/assign-to-student/:studentId", protect, isAdmin, assignCoursesToStudent);
```

### 5. Frontend - Student Management
**File:** `PrepEase/pages/admin/StudentManagement.tsx`

#### New UI Components:

**Book Icon Button** in student table Actions column
- Opens modal for course management
- Color: Emerald green for visibility

**Course Selection Modal**
- Shows all available courses
- Displays: code, title, department, semester, credits
- Checkboxes to select/deselect courses
- Sortable by department
- Shows count of selected courses
- Cancel/Assign buttons

#### New State Management:
```typescript
const [showCourseModal, setShowCourseModal] = useState(false);
const [selectedStudentForCourses, setSelectedStudentForCourses] = useState<any>(null);
const [allCourses, setAllCourses] = useState<any[]>([]);
const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
const [assigningCourses, setAssigningCourses] = useState(false);
```

#### New Functions:
- `fetchAllCourses()` - Loads all courses once on component mount
- `handleOpenCourseModal(student)` - Opens modal, pre-loads student's current courses
- `handleAssignCourses()` - POSTs assignment to backend
- `toggleCourse(courseId)` - Toggles checkbox state

## Admin Workflow

### Step 1: Access Student Management
- Navigate to admin panel
- Click "Student Management"

### Step 2: Find Student
- Search by name or email
- Or scroll through student list

### Step 3: Manage Courses
- Click the **Book icon** in the Actions column
- Modal opens showing all available courses

### Step 4: Select Courses
- Check/uncheck courses for that student
- Modal shows real-time count of selected courses
- Courses are sorted by department for easy browsing

### Step 5: Save Assignment
- Click "Assign Courses" button
- Success message confirms assignment
- Modal closes, list refreshes

## Student Experience

### Before Setup
- Dashboard shows "No enrolled courses"
- "Available Courses" section empty or shows all courses

### After Admin Assigns Courses
- Dashboard shows enrolled/available courses
- Can only see and enroll in admin-assigned courses
- Cannot browse or access other courses

### Example:
```
Admin assigns to Student "Ahmed":
  - CSC-101: Intro to CS
  - CSC-102: Data Structures
  - CSC-201: Algorithms

Ahmed logs in and sees:
  - Only these 3 courses available
  - Other courses are invisible
  - Can enroll in any of these 3
```

## Security Model

### API Security
```
POST /courses/assign-to-student/:studentId
├─ protect middleware (user must be authenticated)
├─ isAdmin middleware (user must be admin)
└─ Validates target is a student
```

### Data Isolation
- Student sees only courses in their `availableCourses` array
- Database query filters by ID membership: `{ _id: { $in: student.availableCourses } }`
- Consistent filtering at all API levels

### Role-Based Access
| Role | Can Assign Courses | Can See All Courses | Sees Assigned Courses |
|------|-------------------|--------------------|-----------------------|
| Admin | ✅ Yes | ✅ Yes | N/A |
| Teacher | ❌ No | ✅ Yes | N/A |
| Student | ❌ No | ❌ No | ✅ Yes (only assigned) |

## Technical Implementation

### Data Structure
```
User (Student)
├─ _id: ObjectId
├─ firstName: string
├─ lastName: string
├─ email: string
├─ role: "Student"
└─ availableCourses: [
    ObjectId (ref: Course),
    ObjectId (ref: Course),
    ...
  ]
```

### Course Assignment Flow
```
Admin opens Student Management
    ↓
Clicks Book icon for student
    ↓
Modal fetches all courses (via fetchAllCourses)
    ↓
Pre-loads student's current availableCourses
    ↓
Checkboxes updated based on current assignments
    ↓
User selects/deselects courses
    ↓
Clicks "Assign Courses"
    ↓
POST /courses/assign-to-student/:studentId
│
└─ Backend:
   ├─ Validates admin role
   ├─ Validates student exists
   ├─ Sets user.availableCourses = courseIds
   ├─ Saves to database
   └─ Returns updated student with populated courses
    ↓
Success message shown
    ↓
List refreshes
```

### Student Course Fetch Flow
```
Student logs in
    ↓
Dashboard calls GET /courses
    ↓
API checks user.role === "Student"
    ↓
Fetches student's availableCourses array
    ↓
Query: Course.find({ _id: { $in: student.availableCourses } })
    ↓
Returns only assigned courses
    ↓
Dashboard displays assigned courses
```

## API Endpoints

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| GET | `/courses` | Student | Fetch only assigned courses |
| GET | `/courses` | Admin/Teacher | Fetch all courses |
| GET | `/courses` | Unauthenticated | 401 Unauthorized |
| POST | `/courses/assign-to-student/:studentId` | Admin | Assign courses to specific student |
| POST | `/courses/assign-to-student/:studentId` | Non-Admin | 403 Forbidden |

## Database Considerations

### Migration from Previous System
If previously used global availability:
```javascript
// Remove course-level availability
db.courses.updateMany({}, { $unset: { availableToStudents: 1 } })

// Initialize students with empty availableCourses
db.users.updateMany(
  { role: "Student" },
  { $set: { availableCourses: [] } }
)
```

### Performance Notes
- `availableCourses` is indexed on User model
- Course fetch uses `$in` operator for efficient querying
- Admin course listing not affected (no filtering)

## Testing Checklist
- ✅ Backend filters courses for students
- ✅ Backend returns all courses for admins
- ✅ Admin can assign courses to student
- ✅ Student sees only assigned courses
- ✅ Frontend modal shows/hides correctly
- ✅ Course checkboxes toggle properly
- ✅ Assignment persists in database
- ✅ Error handling for invalid student
- ✅ Security: non-admin cannot assign
- ✅ No compilation errors

## Files Modified
1. `backend/models/User.js` - Added availableCourses array
2. `backend/models/Course.js` - Removed global availability field
3. `backend/controllers/courseController.js` - Updated getAllCourses(), added assignCoursesToStudent()
4. `backend/routes/courseRoutes.js` - Removed toggle route, added assign-to-student route
5. `PrepEase/pages/admin/StudentManagement.tsx` - Added course management modal and UI
