# Troubleshooting Guide - Gemini AI Integration

## Common Issues & Solutions

### 1. "Material is not yet processed by AI service"

**Problem**: When trying to chat or generate content, you get this error.

**Cause**: The material doesn't have extracted text yet.

**Solutions**:

#### Option A: Re-upload the PDF
1. Delete the existing material
2. Upload it again
3. Wait for status to change to "Ready"

#### Option B: Process existing materials
Run this script in your backend directory:

```javascript
// processOldMaterials.js already exists - run it:
node processOldMaterials.js
```

#### Option C: Manual database update (if needed)
```javascript
// In MongoDB Compass or mongosh
use your_database_name;

// Find materials without extractedText
db.coursematerials.find({ extractedText: { $exists: false } });

// If you have the extracted text, update manually:
db.coursematerials.updateOne(
  { _id: ObjectId("your_material_id") },
  { $set: { extractedText: "your extracted text here", status: "Ready" } }
);
```

---

### 2. "Could not connect to the server" (CORS Error)

**Problem**: Frontend can't reach backend API.

**Symptoms**:
- Browser console shows CORS errors
- Network requests fail
- "XMLHttpRequest cannot load..." error

**Solutions**:

#### Check Backend is Running
```bash
# Terminal 1
cd /Users/muhammadanwar/Prep-Ease/backend
npm start

# Should see: "Server running on port 5001"
```

#### Verify CORS Settings
In `backend/server.js`, ensure:
```javascript
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

#### Check Frontend Port
Make sure your React app runs on port 3000 or 3001:
```bash
cd /Users/muhammadanwar/Prep-Ease/PrepEase
npm start
# or
npm run dev
```

---

### 3. "Failed to extract text from PDF"

**Problem**: PDF upload succeeds but text extraction fails.

**Error in logs**: `[PDF] Extraction failed: pdf is not a function`

**Solution**: Already fixed! But if you see it again:

```javascript
// In backend/utils/aiService.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// NOT: import pdf from "pdf-parse";
```

---

### 4. Gemini API Errors

**Problem**: AI features fail with API errors.

**Common Errors**:

#### "API key not valid"
```bash
# Check .env file
cd /Users/muhammadanwar/Prep-Ease/backend
cat .env | grep GEMINI

# Should show:
# GEMINI_API_KEY=AIzaSyDYpdnj-w_vVZUsizg16YfOaNKsCLMnviU
```

#### "Quota exceeded"
- Gemini has rate limits
- Wait a few minutes
- Check usage: https://makersuite.google.com/

#### "Model not found"
Change model in `services/geminiService.js`:
```javascript
// Try different models:
model: 'gemini-1.5-flash'  // Current (fastest)
model: 'gemini-1.5-pro'    // More capable
model: 'gemini-pro'        // Older version
```

---

### 5. Chat Not Working

**Problem**: Chat page loads but messages don't send.

**Debugging Steps**:

#### 1. Check Browser Console
Open DevTools (F12) → Console tab
Look for errors

#### 2. Check Network Tab
DevTools → Network → Filter XHR
- Should see POST to `/api/chat`
- Check status code (200 = success)
- Check response body

#### 3. Verify Material Has Text
```bash
# In MongoDB Compass or mongosh
db.coursematerials.findOne({ _id: ObjectId("your_material_id") }, { extractedText: 1, status: 1 })

# Should return:
# {
#   extractedText: "some text here...",
#   status: "Ready"
# }
```

#### 4. Check Backend Logs
```bash
# In backend terminal, you should see:
[Chat] User 123... asking about material 456...
[Chat] Gemini AI response received for material 456...
```

---

### 6. Quiz Generation Fails

**Problem**: "Failed to generate quiz" error.

**Possible Causes**:

#### JSON Parsing Error
Gemini might return improperly formatted JSON.

**Fix in `services/geminiService.js`:**
```javascript
// Add better JSON extraction
const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr);
}
```

#### Too Many Questions Requested
Reduce `questionCount` in the request:
```javascript
// In frontend: AIGenerator.tsx
setQuestionCount(5); // Start with 5, not 20
```

---

### 7. Frontend Build Errors

**Problem**: TypeScript/React compilation errors.

**Common Issues**:

#### Missing Types
```bash
cd /Users/muhammadanwar/Prep-Ease/PrepEase
npm install --save-dev @types/react @types/react-dom
```

#### Import Errors
```typescript
// Use .tsx for TypeScript React files
// Use .jsx for JavaScript React files

// In App.jsx, import should be:
import StudyBuddyChat from "../pages/student/StudyBuddyChat.tsx";
```

---

### 8. Authentication Issues

**Problem**: "Unauthorized" or "Token expired" errors.

**Solutions**:

#### Clear Local Storage
```javascript
// In browser console:
localStorage.clear();
// Then login again
```

#### Check Token in Requests
```javascript
// In browser DevTools → Network → Headers
// Should see:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Verify JWT Secret
```bash
# backend/.env
JWT_SECRET=7a98a700b48e7f888870196c39226f12ebb14e4fbcfc4dcb0fcfd83765f1a45b
```

---

### 9. Database Connection Issues

**Problem**: "MongoDB connection failed" error.

**Solutions**:

#### Check MongoDB URI
```bash
# backend/.env
MONGO_URI=mongodb+srv://easePrep:anwar16-@cluster0.nbkjxbk.mongodb.net/?appName=Cluster0
```

#### Verify Network Access
- Go to MongoDB Atlas dashboard
- Network Access → Add your IP address
- Or allow access from anywhere (0.0.0.0/0) for development

#### Test Connection
```bash
cd /Users/muhammadanwar/Prep-Ease/backend
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ Connected'))
  .catch(err => console.error('✗ Failed:', err));
"
```

---

### 10. Material Status Stuck on "Processing"

**Problem**: Uploaded PDF shows "Processing" forever.

**Cause**: PDF extraction crashed silently.

**Solutions**:

#### Check Backend Logs
Look for:
```
[Processing] Extracting text from: /path/to/file.pdf
[PDF] Extraction failed: ...
[Processing] Failed for material 123...
```

#### Manually Update Status
```javascript
// In MongoDB
db.coursematerials.updateOne(
  { _id: ObjectId("material_id") },
  { $set: { status: "Failed" } }
);
```

#### Re-upload
Delete and upload again with a simpler PDF.

---

## Quick Diagnostic Commands

### Backend Health Check
```bash
curl http://localhost:5001/health
# Should return: OK

curl http://localhost:5001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Should return JSON with token or error
```

### Check Running Processes
```bash
# Check if backend is running
lsof -ti:5001

# If running, kill it:
kill $(lsof -ti:5001)

# Restart:
cd /Users/muhammadanwar/Prep-Ease/backend && npm start
```

### Check Frontend
```bash
# Check if frontend is running
lsof -ti:3000

# Access in browser:
open http://localhost:3000
```

### View Backend Logs in Real-time
```bash
cd /Users/muhammadanwar/Prep-Ease/backend
npm start | tee -a debug.log
```

---

## Environment Variables Checklist

Create `.env` in `backend/` with:

```env
# Required
PORT=5001
MONGO_URI=mongodb+srv://easePrep:anwar16-@cluster0.nbkjxbk.mongodb.net/?appName=Cluster0
JWT_SECRET=7a98a700b48e7f888870196c39226f12ebb14e4fbcfc4dcb0fcfd83765f1a45b
GEMINI_API_KEY=AIzaSyDYpdnj-w_vVZUsizg16YfOaNKsCLMnviU

# Optional (not used anymore but won't hurt)
AI_SERVICE_URL=http://localhost:8000
```

---

## Testing Workflow

### 1. Fresh Start
```bash
# Terminal 1: Backend
cd /Users/muhammadanwar/Prep-Ease/backend
npm start

# Terminal 2: Frontend
cd /Users/muhammadanwar/Prep-Ease/PrepEase
npm start
```

### 2. Login
- Navigate to http://localhost:3000
- Login as:
  - **Student**: wasiq@arid.edu.pk / (your password)
  - **Teacher**: (teacher email) / (your password)

### 3. Test Study Buddy (Student)
1. Go to Dashboard
2. Find a course with materials
3. Click on a material with status "Ready"
4. Click "Start Chat"
5. Ask: "What is this material about?"
6. Wait 2-4 seconds for AI response

### 4. Test AI Generator (Teacher)
1. Go to "AI Generator" in sidebar
2. Select a material from dropdown
3. Click "Generate Quiz" tab
4. Set difficulty: medium, questions: 5
5. Click "Generate with AI"
6. Wait 5-10 seconds for quiz to appear

---

## Support

If issues persist:

1. **Check this file first**: `GEMINI_INTEGRATION_COMPLETE.md`
2. **View backend logs**: Look for error messages
3. **Check browser console**: DevTools → Console
4. **Verify environment**: All .env variables set correctly
5. **Test API directly**: Use Postman or curl

---

## Emergency Reset

If everything breaks:

```bash
# 1. Stop all processes
kill $(lsof -ti:5001)
kill $(lsof -ti:3000)

# 2. Clear node_modules (if needed)
cd /Users/muhammadanwar/Prep-Ease/backend
rm -rf node_modules package-lock.json
npm install

cd /Users/muhammadanwar/Prep-Ease/PrepEase
rm -rf node_modules package-lock.json
npm install

# 3. Restart everything
cd /Users/muhammadanwar/Prep-Ease/backend && npm start
# (New terminal)
cd /Users/muhammadanwar/Prep-Ease/PrepEase && npm start

# 4. Clear browser cache
# Browser → DevTools → Application → Clear Storage → Clear site data
```

---

**Last Updated**: March 12, 2024  
**Status**: All systems operational ✅
