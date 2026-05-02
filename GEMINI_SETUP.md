# 🎉 Gemini AI Integration - Complete Setup Guide

## ✅ What Was Changed

### **Architecture Simplification**
- ❌ **REMOVED**: Python FastAPI service
- ❌ **REMOVED**: Local AI models (sentence-transformers, FLAN-T5)
- ❌ **REMOVED**: FAISS vector storage
- ✅ **ADDED**: Google Gemini API integration
- ✅ **ADDED**: Direct text-based RAG (no embeddings needed)

### **New Features Implemented**
1. ✅ **Study Buddy Chat** - AI answers questions from PDF content
2. ✅ **Quiz Generation** - Auto-generate quizzes from materials
3. ✅ **Assignment Generation** - Create assignments automatically
4. ✅ **Flashcard Generation** - Generate study flashcards
5. ✅ **Resource Suggestions** - Suggest additional learning resources

---

## 🔑 Get Your Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key

**Free Tier:**
- First 1,500 requests/day: **FREE**
- After that: $0.35 per 1M tokens
- Perfect for FYP projects!

---

## ⚙️ Setup Instructions

### Step 1: Add Gemini API Key

Edit `/backend/.env`:

```bash
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

Replace `YOUR_ACTUAL_API_KEY_HERE` with your real API key from Google.

### Step 2: Verify Backend is Running

```bash
cd backend
npm start
```

You should see:
```
Server running on port 5001
MongoDB Connected
```

### Step 3: Test the Features

#### **A. Upload a PDF**
1. Login as Teacher
2. Go to your course
3. Upload a PDF material
4. Wait for "Ready" status

#### **B. Test Study Buddy Chat**

```bash
curl -X POST http://localhost:5001/api/study-buddy/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "materialId": "YOUR_MATERIAL_ID",
    "question": "What is this lecture about?"
  }'
```

#### **C. Generate Quiz**

```bash
curl -X POST http://localhost:5001/api/study-buddy/generate-quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "materialId": "YOUR_MATERIAL_ID",
    "difficulty": "medium",
    "questionCount": 5
  }'
```

#### **D. Generate Flashcards**

```bash
curl -X POST http://localhost:5001/api/study-buddy/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "materialId": "YOUR_MATERIAL_ID",
    "count": 10
  }'
```

---

## 📁 New Files Created

### Backend:
- `services/geminiService.js` - Gemini AI integration
- `controllers/studyBuddyController.js` - Updated with all features
- `routes/studyBuddyRoutes.js` - Updated routes

### Updated Files:
- `models/Material.js` - Added `extractedText` field
- `models/CourseMaterial.js` - Added `extractedText` field
- `controllers/materialController.js` - Simplified PDF processing
- `.env` - Added `GEMINI_API_KEY`

---

## 🎯 API Endpoints

All endpoints require JWT authentication.

### 1. Study Buddy Chat
**POST** `/api/study-buddy/chat`

**Request:**
```json
{
  "materialId": "string",
  "question": "string"
}
```

**Response:**
```json
{
  "answer": "AI generated answer based on PDF content"
}
```

### 2. Generate Quiz
**POST** `/api/study-buddy/generate-quiz`

**Request:**
```json
{
  "materialId": "string",
  "difficulty": "easy|medium|hard",
  "questionCount": 5
}
```

**Response:**
```json
{
  "materialId": "string",
  "materialTitle": "string",
  "difficulty": "medium",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct"
    }
  ]
}
```

### 3. Generate Assignment
**POST** `/api/study-buddy/generate-assignment`

**Request:**
```json
{
  "materialId": "string",
  "assignmentType": "essay|project|research",
  "difficulty": "easy|medium|hard"
}
```

**Response:**
```json
{
  "title": "Assignment title",
  "type": "essay",
  "instructions": "Clear instructions",
  "questions": ["Q1", "Q2", "Q3"],
  "evaluationCriteria": ["Criterion 1", "Criterion 2"],
  "suggestedWordCount": "500-1000 words",
  "estimatedTime": "2 hours"
}
```

### 4. Generate Flashcards
**POST** `/api/study-buddy/generate-flashcards`

**Request:**
```json
{
  "materialId": "string",
  "count": 10
}
```

**Response:**
```json
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition"
    }
  ]
}
```

### 5. Suggest Resources
**POST** `/api/study-buddy/suggest-resources`

**Request:**
```json
{
  "materialId": "string",
  "topic": "specific topic student wants to learn more about"
}
```

**Response:**
```json
{
  "resources": [
    {
      "type": "video|article|book|practice",
      "title": "Resource title",
      "description": "Why this helps",
      "suggestedSource": "YouTube/Khan Academy/etc"
    }
  ]
}
```

---

## 🚀 Frontend Integration

Update your frontend to call these endpoints. Example React code:

```javascript
// Study Buddy Chat
const chatWithAI = async (materialId, question) => {
  const response = await axios.post('/api/study-buddy/chat', {
    materialId,
    question
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data.answer;
};

// Generate Quiz
const generateQuiz = async (materialId) => {
  const response = await axios.post('/api/study-buddy/generate-quiz', {
    materialId,
    difficulty: 'medium',
    questionCount: 5
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

// Generate Flashcards
const generateFlashcards = async (materialId) => {
  const response = await axios.post('/api/study-buddy/generate-flashcards', {
    materialId,
    count: 10
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data.flashcards;
};
```

---

## ✅ Benefits of This Approach

1. **No Heavy Models**: No need to download GB-sized AI models
2. **Fast Setup**: Just add API key and go
3. **Production Ready**: Gemini is enterprise-grade
4. **Cost Effective**: Free tier is generous for FYP
5. **Better Quality**: Gemini 1.5 Flash is more powerful than local models
6. **Easy Maintenance**: No Python service to manage
7. **Scalable**: Google's infrastructure handles everything

---

## 🐛 Troubleshooting

### Error: "API key not found"
- Make sure you added `GEMINI_API_KEY` to `.env`
- Restart the backend after adding the key

### Error: "Material has no extracted text"
- The PDF upload must complete successfully first
- Check material status is "Ready"

### Error: "Failed to generate quiz"
- Check if Gemini API key is valid
- Check if you've exceeded free tier limits
- View backend logs: `tail -f /tmp/backend_gemini.log`

---

## 📊 Monitoring

Watch backend logs in real-time:
```bash
tail -f /tmp/backend_gemini.log
```

You'll see:
```
[Processing] Extracting text from: uploads/xxx.pdf
[Gemini] Material 123 ready for AI features. Text length: 5012 characters
[Study Buddy] Chat request for material 123
[Study Buddy] Generating quiz for material 123
```

---

## 🎓 Next Steps

1. **Add API key** to `.env`
2. **Upload a PDF** as Teacher
3. **Test chat** as Student
4. **Generate quiz/flashcards**
5. **Update frontend** with new features

---

## 💡 Tips

- Keep questions specific to PDF content
- Use "medium" difficulty for most use cases
- Generate 5-10 flashcards for best results
- The AI will refuse to answer questions not in the PDF
- All responses are grounded in uploaded content only

---

**You're all set! 🎉**

The Python AI service is no longer needed. Everything runs through Gemini API now!
