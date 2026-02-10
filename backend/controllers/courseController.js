import Course from "../models/Course.js";
import User from "../models/User.js";

// ADMIN: Create Course
export const createCourse = async (req, res) => {
  try {
    const { courseCode, title, description, credits, semester, year } = req.body;

    if (!courseCode || !title) {
      return res.status(400).json({ message: "courseCode and title are required." });
    }

    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists." });
    }

    const course = await Course.create({
      courseCode,
      title,
      description: description || "",
      credits: credits || 3,
      semester: semester || "Fall",
      year: year || new Date().getFullYear(),
      teachers: [],
    });

    return res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to create course." });
  }
};

// ADMIN: Get All Courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teachers", "firstName lastName email")
      .sort({ courseCode: 1 })
      .lean();

    return res.status(200).json({ courses });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch courses." });
  }
};

// ADMIN: Get Course By ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate("teachers", "firstName lastName email");

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch course." });
  }
};

// ADMIN: Update Course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, credits, semester, year, isActive } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (credits) course.credits = credits;
    if (semester) course.semester = semester;
    if (year) course.year = year;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    return res.status(200).json({
      message: "Course updated successfully.",
      course,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to update course." });
  }
};

// ADMIN: Delete Course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({
      message: "Course deleted successfully.",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to delete course." });
  }
};

// ADMIN: Assign Teacher to Course
export const assignTeacherToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "Teacher") {
      return res.status(404).json({ message: "Teacher not found." });
    }

    if (course.teachers.includes(teacherId)) {
      return res.status(400).json({ message: "Teacher already assigned to this course." });
    }

    course.teachers.push(teacherId);
    await course.save();

    const populatedCourse = await Course.findById(courseId).populate("teachers", "firstName lastName email");

    return res.status(200).json({
      message: "Teacher assigned to course successfully.",
      course: populatedCourse,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to assign teacher." });
  }
};

// ADMIN: Remove Teacher from Course
export const removeTeacherFromCourse = async (req, res) => {
  try {
    const { courseId, teacherId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    course.teachers = course.teachers.filter((id) => id.toString() !== teacherId);
    await course.save();

    const populatedCourse = await Course.findById(courseId).populate("teachers", "firstName lastName email");

    return res.status(200).json({
      message: "Teacher removed from course successfully.",
      course: populatedCourse,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to remove teacher." });
  }
};

// TEACHER: Get My Assigned Courses
export const getMyAssignedCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const courses = await Course.find({ teachers: teacherId, isActive: true })
      .populate("teachers", "firstName lastName email")
      .sort({ courseCode: 1 });

    return res.status(200).json({ courses });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch your courses." });
  }
};
