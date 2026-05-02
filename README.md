# PrepEase

PrepEase is an AI-powered learning platform that helps students study smarter and helps teachers create better course content. It combines a React frontend, a Node.js/Express backend, and AI-assisted study tools for chat, quiz generation, assignments, and flashcards.

## Overview

The platform is designed around uploaded course materials. Teachers can add learning resources, and students can interact with those materials through an AI study buddy that answers questions using grounded content from the document.

## Key Features

- AI study buddy for asking questions about uploaded materials
- Quiz, assignment, and flashcard generation for teachers
- Course enrollment and access control for students
- PDF text extraction and material processing
- React-based dashboard with a responsive UI
- JWT-based authentication and role-based permissions

## Project Structure

```text
Prep-Ease/
├── PrepEase/          # React + Vite frontend
├── backend/           # Node.js + Express API
├── ai-service/        # Python AI microservice
└── README.md          # Project overview and setup
```

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB, JWT
- **AI Integration:** Google Gemini, content-grounded prompts, PDF extraction
- **Optional AI Service:** FastAPI-based internal AI microservice for semantic retrieval workflows

## Requirements

- Node.js 18+
- npm
- Python 3.10+ if you want to run `ai-service`
- MongoDB connection string
- A valid Gemini API key

## Setup

### 1. Install dependencies

```bash
cd PrepEase
npm install

cd ../backend
npm install

cd ../ai-service
pip install -r requirements.txt
```

### 2. Configure environment variables

Create or update `backend/.env` with the required values, including:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
```

If you use the Python AI service, configure its environment variables as needed as well.

### 3. Start the backend

```bash
cd backend
npm run dev
```

The API usually runs on `http://localhost:5001`.

### 4. Start the frontend

```bash
cd PrepEase
npm run dev
```

The frontend usually runs on `http://localhost:5173`.

### 5. Optional: start the AI service

```bash
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Common Workflow

1. A teacher uploads a PDF or learning resource.
2. The backend extracts and stores the content.
3. AI features become available for the material.
4. Students open Study Buddy to ask grounded questions.
5. Teachers generate quizzes, assignments, or flashcards from the same material.

## Troubleshooting

- If Gemini requests fail, verify that `GEMINI_API_KEY` is correct and restart the backend.
- If the frontend cannot connect, confirm the backend is running on port `5001`.
- If MongoDB is unavailable, verify the `MONGODB_URI` value in `backend/.env`.
- If AI features are unavailable, ensure the uploaded material finished processing successfully.

## Useful References

- `QUICK_START.md` for a fast local setup
- `backend/GEMINI_INTEGRATION_SUMMARY.md` for AI configuration details
- `backend/FLASHCARD_IMPLEMENTATION.md` for flashcard workflow details
- `backend/00_START_HERE.md` for implementation status and API overview

## License

No license has been specified in this repository.
