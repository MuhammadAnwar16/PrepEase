import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  assignTeacherToCourse,
  removeTeacherFromCourse,
  getMyAssignedCourses,
} from "../controllers/courseController.js";
import { protect, isAdmin, isTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes - Course management
router.post("/", protect, isAdmin, createCourse);
router.get("/", protect, getAllCourses);
router.get("/id/:id", protect, getCourseById);
router.put("/:id", protect, isAdmin, updateCourse);
router.delete("/:id", protect, isAdmin, deleteCourse);

// Admin routes - Teacher assignment
router.post("/:courseId/assign-teacher", protect, isAdmin, assignTeacherToCourse);
router.delete("/:courseId/teacher/:teacherId", protect, isAdmin, removeTeacherFromCourse);

// Teacher routes
router.get("/teacher/my-courses", protect, isTeacher, getMyAssignedCourses);

export default router;
