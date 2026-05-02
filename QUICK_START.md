# 🚀 Prep-Ease Quick Start Guide

## ⚠️ CRITICAL FIRST STEP

**Your Gemini API key is invalid. You MUST update it first:**

1. Get new key: https://aistudio.google.com/app/apikey
2. Open: `backend/.env`
3. Replace:
   ```
   GEMINI_API_KEY=YOUR_NEW_KEY_HERE
   ```

## 🏃 Start the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
**Expected:** Server running on port 5001

### Terminal 2: Frontend
```bash
cd PrepEase
npm run dev
```
**Expected:** Vite server running (usually port 5173)

## 🧪 Test the Integration

### Quick API Test
```bash
cd backend
node test-gemini-updated.js
```
**Expected:** ✅ Success with AI response

## 👨‍🏫 Test as Teacher

1. Login: wasiq@arid.edu.pk / 123456
2. Navigate to your course
3. Upload Materials > Select PDF
4. Watch backend logs for: `[Gemini] Material ... ready for AI features`
5. Try: Generate Quiz / Assignment / Flashcards

## 👨‍🎓 Test as Student

1. Login: anwar@gmail.com / 123456
2. Click "Study Buddy" or "AI Chat"
3. Select a material from dropdown
4. Ask: "What is this material about?"
5. Verify: Answer is based only on PDF content

## 🔍 Common Issues

### Backend won't start
- Check: `npm install` ran successfully
- Check: MongoDB connection string in `.env`
- Check: Port 5001 is available

### Frontend won't connect
- Check: Backend is running on port 5001
- Check: CORS is configured in `server.js`
- Check: Browser console for errors

### Chat says "Material not ready"
- Check: PDF was uploaded successfully
- Check: Backend logs show extraction success
- Check: Material status is "Ready" (check database or logs)

### Gemini errors
- Check: API key is valid (no spaces, no quotes)
- Check: Backend restarted after .env change
- Run: `node test-gemini-updated.js` to diagnose

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/.env` | Configuration (API keys, DB) |
| `backend/services/geminiService.js` | AI logic |
| `backend/utils/aiService.js` | PDF extraction |
| `backend/controllers/chatController.js` | Chat endpoint |
| `PrepEase/pages/student/StudyBuddyChat.tsx` | Student chat UI |
| `PrepEase/pages/teacher/AIGenerator.tsx` | Teacher AI tools |

## 📊 System Architecture

```
Student Browser
    ↓
React Frontend (Port 5173)
    ↓
Node.js Backend (Port 5001)
    ↓
Gemini AI API
    ↓
MongoDB Atlas
```

## 🎯 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| PDF Upload | ✅ Working | Teacher only |
| Text Extraction | ✅ Working | Automatic |
| Material Selection | ✅ Working | Dropdown in chat |
| Study Buddy Chat | ⏳ Needs API Key | All code ready |
| Quiz Generation | ⏳ Needs API Key | All code ready |
| Assignment Gen | ⏳ Needs API Key | All code ready |
| Flashcard Gen | ⏳ Needs API Key | All code ready |

## 💡 Quick Tips

1. **Always check backend logs** - They show what's happening
2. **Material must be "Ready"** - Check status before chatting
3. **Ask content-specific questions** - AI only knows PDF content
4. **Restart after .env changes** - Always restart backend

## 🔗 Useful URLs

- Frontend: http://localhost:5173 (or shown in terminal)
- Backend: http://localhost:5001
- API Health: http://localhost:5001/api/health (if implemented)
- Gemini API Keys: https://aistudio.google.com/app/apikey

## 📞 Getting Help

1. Check: `INTEGRATION_COMPLETE.md` for detailed info
2. Check: `GEMINI_INTEGRATION_SUMMARY.md` for troubleshooting
3. Check: Backend console logs
4. Check: Browser console (F12)

---

**Next Step:** Update your Gemini API key in `backend/.env` and restart!
