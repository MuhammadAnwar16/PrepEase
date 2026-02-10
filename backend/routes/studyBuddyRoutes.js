import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  processLectureUpload,
  studyBuddyChat,
  checkAIServiceHealth
} from '../controllers/studyBuddyController.js';

const router = express.Router();

/**
 * POST /api/study-buddy/process
 * Process uploaded lecture (called after teacher uploads file)
 * Protected: Authenticated users
 */
router.post('/process', protect, processLectureUpload);

/**
 * POST /api/study-buddy
 * Main chat endpoint for students
 * Protected: Authenticated users (students + teachers)
 */
router.post('/', protect, studyBuddyChat);

/**
 * GET /api/study-buddy/health
 * Check AI service health
 * Public endpoint for monitoring
 */
router.get('/health', checkAIServiceHealth);

export default router;
