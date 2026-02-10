import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import axios from "axios";
import Course from "../models/Course.js";
import CourseMaterial from "../models/CourseMaterial.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import { extractPDFText, ingestMaterialToAI } from "../utils/aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_STUDY_BUDDY_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Ensure uploads directory exists (backend/uploads)
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or PPT files are allowed."));
  }
};

export const upload = multer({ storage, fileFilter });

export const uploadMaterial = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    if (!title) {
      return res.status(400).json({ message: "title is required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    const course = mongoose.Types.ObjectId.isValid(courseId)
      ? await Course.findById(courseId)
      : await Course.findOne({ courseCode: courseId });
    if (!course) {
      return res.status(400).json({ message: "Invalid course ID. Please check the course code." });
    }

    // Authorization: Teachers can only upload to their assigned courses
    if (req.user.role === "Teacher") {
      if (!course.teachers.includes(userId)) {
        return res.status(403).json({
          message: "You are not assigned to this course. Contact your administrator.",
        });
      }
    }

    const fileType = req.file.mimetype.includes("pdf") ? "PDF" : "PPT";
    const fileUrl = `/uploads/${req.file.filename}`;

    const material = await CourseMaterial.create({
      course: course._id,
      userId,
      title,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl,
      fileType,
      status: "Processing",
      aiStatus: "pending",
      materialType: "lecture",
      uploadedBy: userId,
    });

    // Process PDF in background (non-blocking)
    if (fileType === "PDF") {
      processPDFAsync(material);
    } else {
      // For PPT, mark as ready without AI processing
      material.status = "Ready";
      await material.save();
    }

    return res.status(201).json({
      message: "Lecture uploaded successfully.",
      material,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Upload failed." });
  }
};

/**
 * Process PDF asynchronously - extract text and send to AI service
 * @param {Object} material - CourseMaterial document
 */
async function processPDFAsync(material) {
  try {
    // Step 1: Extract text from PDF
    console.log(`[Processing] Extracting text from: ${material.filePath}`);
    const extractedText = await extractPDFText(material.filePath);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text content extracted from PDF");
    }

    // Save extracted text
    material.textContent = extractedText;
    material.status = "Ready";
    await material.save();

    // Step 2: Send to AI service (non-critical)
    try {
      console.log(`[AI] Ingesting material: ${material._id}`);
      await ingestMaterialToAI(material._id, extractedText);
      
      material.aiStatus = "processed";
      await material.save();
      
      console.log(`[AI] Material ${material._id} processed successfully`);
      
      // Step 3: Process for Study Buddy (RAG)
      await processForStudyBuddy(material._id, material.filePath);
      
    } catch (aiError) {
      // AI failure should not affect upload success
      console.error(`[AI] Failed to ingest material ${material._id}:`, aiError.message);
      
      material.aiStatus = "pending";
      await material.save();
    }

  } catch (error) {
    console.error(`[Processing] Failed for material ${material._id}:`, error.message);
    
    material.status = "Pending";
    material.aiStatus = "failed";
    await material.save();
  }
}

/**
 * Process material for Study Buddy (RAG system)
 * Directly calls Python AI service to process lecture content
 * @param {String} materialId - Material ID
 * @param {String} filePath - File path
 */
async function processForStudyBuddy(materialId, filePath) {
  try {
    console.log(`[Study Buddy] Processing material ${materialId} for RAG`);
    
    // Step 1: Extract text
    const { extractText, chunkText } = await import('../utils/textExtractor.js');
    const extractedText = await extractText(filePath);
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.error(`[Study Buddy] No text extracted from ${filePath}`);
      return;
    }
    
    console.log(`[Study Buddy] Extracted ${extractedText.length} characters`);
    
    // Step 2: Create chunks
    const chunks = chunkText(extractedText, 600, 100);
    console.log(`[Study Buddy] Created ${chunks.length} chunks`);
    
    // Step 3: Send directly to Python AI service
    await axios.post(`${AI_STUDY_BUDDY_URL}/embed`, {
      lectureId: materialId.toString(),
      chunks: chunks
    }, {
      timeout: 120000, // 2 minutes
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[Study Buddy] Material ${materialId} ready for chat`);
  } catch (error) {
    console.error(`[Study Buddy] Processing failed for ${materialId}:`, error.message);
    // Don't fail the main upload - Study Buddy is optional
  }
}

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const material = await CourseMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    // Check if user owns the material
    if (material.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You do not have permission to delete this material." });
    }

    // Delete file from disk
    if (fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    // Delete from database
    await CourseMaterial.findByIdAndDelete(id);

    return res.status(200).json({ message: "Material deleted successfully." });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to delete material." });
  }
};

export const getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Authorization check
    if (req.user.role === "Student") {
      // Students must be enrolled to access course materials
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: courseId,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access its materials.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access materials from their own courses
      if (!course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You can only access materials from your own courses.",
        });
      }
    }

    const materials = await CourseMaterial.find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ materials });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to load materials." });
  }
};

export const getAllMaterials = async (req, res) => {
  try {
    const userId = req.user._id;

    let query = {};

    // For students, return only materials from enrolled courses
    if (req.user.role === "Student") {
      const enrollments = await StudentEnrollment.find({
        student: userId,
      }).select("course");

      const courseIds = enrollments.map((e) => e.course);
      query = { course: { $in: courseIds } };
    }
    // For teachers, return only their own course materials
    else if (req.user.role === "Teacher") {
      const courses = await Course.find({
        teacher: userId,
      }).select("_id");

      const courseIds = courses.map((c) => c._id);
      query = { course: { $in: courseIds } };
    }
    // For admins, return all materials (no query filter)

    const materials = await CourseMaterial.find(query)
      .populate("course", "courseCode title teacher")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ materials });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to load materials." });
  }
};
