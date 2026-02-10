import express from "express";
import { askQuestion, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI Study Buddy Chat Endpoint
router.post("/", protect, askQuestion);

// Legacy endpoint (backward compatibility)
router.post("/send", protect, sendMessage);

export default router;
