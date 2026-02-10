import express from "express";
import { getCourseMaterials, getAllMaterials, upload, uploadMaterial, deleteMaterial } from "../controllers/materialController.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, isTeacher, upload.single("file"), uploadMaterial);
router.delete("/:id", protect, isTeacher, deleteMaterial);
router.get("/", protect, getAllMaterials);
router.get("/:courseId", protect, getCourseMaterials);

export default router;
