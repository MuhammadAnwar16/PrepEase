import axios from 'axios';
import { extractText, chunkText } from '../utils/textExtractor.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Process uploaded lecture file
 * Called after teacher uploads a file
 */
async function processLectureUpload(req, res) {
  try {
    const { lectureId, filePath } = req.body;
    
    if (!lectureId || !filePath) {
      return res.status(400).json({ 
        message: 'lectureId and filePath are required' 
      });
    }
    
    console.log(`[Study Buddy] Processing lecture ${lectureId}`);
    
    // Step 1: Extract text from file
    let extractedText;
    try {
      extractedText = await extractText(filePath);
    } catch (error) {
      console.error('[Study Buddy] Extraction error:', error.message);
      return res.status(400).json({ 
        message: `Text extraction failed: ${error.message}` 
      });
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        message: 'No text content found in the uploaded file' 
      });
    }
    
    console.log(`[Study Buddy] Extracted ${extractedText.length} characters`);
    
    // Step 2: Split into chunks
    const chunks = chunkText(extractedText, 600, 100);
    
    if (chunks.length === 0) {
      return res.status(400).json({ 
        message: 'Failed to create text chunks' 
      });
    }
    
    console.log(`[Study Buddy] Created ${chunks.length} chunks`);
    
    // Step 3: Send to AI service for embedding
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/embed`,
        {
          lectureId,
          chunks
        },
        {
          timeout: 120000, // 2 minutes for large files
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`[Study Buddy] Lecture ${lectureId} embedded successfully`);
      
      return res.status(200).json({
        success: true,
        message: 'Lecture processed and ready for Study Buddy',
        data: {
          lectureId,
          chunks_created: chunks.length,
          embedding_response: aiResponse.data
        }
      });
      
    } catch (aiError) {
      console.error('[Study Buddy] AI service error:', aiError.message);
      
      if (aiError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: 'AI service is unavailable. Please start the AI service first.' 
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to process lecture with AI service',
        error: aiError.response?.data?.detail || aiError.message
      });
    }
    
  } catch (error) {
    console.error('[Study Buddy] Processing error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during lecture processing',
      error: error.message
    });
  }
}

/**
 * Study Buddy chat endpoint
 * Student asks a question about a specific lecture
 */
async function studyBuddyChat(req, res) {
  try {
    const { question, lectureId } = req.body;
    const userId = req.user?._id; // From auth middleware
    
    // Validation
    if (!question || !lectureId) {
      return res.status(400).json({ 
        message: 'question and lectureId are required' 
      });
    }
    
    if (typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Question must be a non-empty string' 
      });
    }
    
    if (question.length > 500) {
      return res.status(400).json({ 
        message: 'Question is too long (max 500 characters)' 
      });
    }
    
    console.log(`[Study Buddy] User ${userId} asking about lecture ${lectureId}`);
    
    // Call Python AI service
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/study-buddy`,
        {
          question: question.trim(),
          lectureId
        },
        {
          timeout: 30000, // 30 seconds
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { answer, confidence, sources_used } = aiResponse.data;
      
      console.log(`[Study Buddy] Answer generated with ${confidence} confidence`);
      
      return res.status(200).json({
        success: true,
        answer,
        metadata: {
          confidence,
          sources_used,
          lectureId
        }
      });
      
    } catch (aiError) {
      console.error('[Study Buddy] AI error:', aiError.message);
      
      // Handle specific AI service errors
      if (aiError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: 'AI Study Buddy service is temporarily unavailable. Please try again later.' 
        });
      }
      
      if (aiError.response?.status === 404) {
        return res.status(404).json({ 
          message: 'This lecture has not been processed yet. Please contact your teacher.' 
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to get answer from Study Buddy',
        error: aiError.response?.data?.detail || 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('[Study Buddy] Chat error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Check AI service health
 */
async function checkAIServiceHealth(req, res) {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    return res.status(200).json({
      ai_service: 'online',
      details: response.data
    });
  } catch (error) {
    return res.status(503).json({
      ai_service: 'offline',
      error: error.message
    });
  }
}

export {
  processLectureUpload,
  studyBuddyChat,
  checkAIServiceHealth
};
