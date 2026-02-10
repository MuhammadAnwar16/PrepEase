import axios from "axios";
import CourseMaterial from "../models/CourseMaterial.js";
import Course from "../models/Course.js";
import StudentEnrollment from "../models/StudentEnrollment.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * AI Study Buddy Chat Endpoint
 * POST /api/chat
 */
export const askQuestion = async (req, res) => {
  try {
    const { materialId, question } = req.body;
    const userId = req.user._id;

    // Validation
    if (!materialId || !question) {
      return res.status(400).json({ 
        message: "materialId and question are required." 
      });
    }

    if (typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ 
        message: "Question must be a non-empty string." 
      });
    }

    // Check if material exists
    const material = await CourseMaterial.findById(materialId)
      .populate("course")
      .lean();

    if (!material) {
      return res.status(404).json({ 
        message: "Material not found." 
      });
    }

    // Verify material has been processed
    if (material.aiStatus !== "processed") {
      return res.status(400).json({ 
        message: "Material is not yet processed by AI service. Please try again later.",
        aiStatus: material.aiStatus
      });
    }

    // Authorization: Check if user has access to this material
    if (req.user.role === "Student") {
      // Students must be enrolled in the course to access materials
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: material.course._id || material.course,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access this material.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access materials from their own courses
      const course = await Course.findById(material.course._id || material.course);
      if (!course || !course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You do not have access to this material.",
        });
      }
    }

    // Forward to AI service
    try {
      console.log(`[Chat] User ${userId} asking about material ${materialId}`);
      
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/chat`,
        {
          materialId: materialId.toString(),
          question: question.trim(),
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      const answer = aiResponse.data.answer;

      console.log(`[Chat] AI response received for material ${materialId}`);

      return res.status(200).json({
        success: true,
        answer,
        materialId,
        materialTitle: material.title,
      });

    } catch (aiError) {
      console.error("[Chat] AI service error:", aiError.message);

      if (aiError.code === "ECONNREFUSED") {
        return res.status(503).json({ 
          message: "AI service is currently unavailable. Please try again later." 
        });
      }

      if (aiError.response?.status === 404) {
        return res.status(404).json({ 
          message: "Material not found in AI service. Please re-upload the material." 
        });
      }

      return res.status(502).json({ 
        message: "Failed to get response from AI service.",
        error: aiError.response?.data?.detail || aiError.message
      });
    }

  } catch (error) {
    console.error("[Chat] Error:", error.message);
    return res.status(500).json({ 
      message: "Failed to process chat request.",
      error: error.message
    });
  }
};

/**
 * Legacy sendMessage endpoint (keeping for backward compatibility)
 * This can be removed if not needed
 */
export const sendMessage = async (req, res) => {
  // Redirect to new endpoint
  req.body.question = req.body.message;
  return askQuestion(req, res);
};
