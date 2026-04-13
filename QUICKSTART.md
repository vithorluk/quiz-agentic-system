# Quick Start Guide

Get the full quiz application running in under 5 minutes.

## Prerequisites

- Node.js 20+
- At least one LLM API key (Groq recommended - free tier available at https://console.groq.com)

## Setup Steps

### 1. Install Backend Dependencies

```bash
# In the root directory
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
# Minimum required: GROQ_API_KEY
```

Example `.env`:
```bash
GROQ_API_KEY=gsk_your_key_here
DATABASE_PATH=./data/quiz.db
```

### 3. Install Frontend Dependencies

```bash
# Navigate to frontend
cd quiz-frontend

# Install dependencies
npm install

# Return to root
cd ..
```

### 4. Start the Application

**Option A: Run Both (Recommended)**

Open two terminal windows:

**Terminal 1 - Backend API:**
```bash
npm run dev:server
```
Wait for: "Server running on port 3000"

**Terminal 2 - Frontend:**
```bash
cd quiz-frontend
npm run dev
```
Wait for: "Ready on http://localhost:3001"

**Option B: Backend Only (CLI Mode)**
```bash
npm run dev -- --url="https://raw.githubusercontent.com/pipecat-ai/pipecat/main/README.md"
```

## Using the Application

### Web Interface (http://localhost:3001)

1. **Home Page**
   - Enter any GitHub README URL or markdown document URL
   - Click "Generate Quiz"
   - Wait 10-30 seconds for quiz generation

2. **Take Quiz**
   - Answer questions (single or multiple choice)
   - Track progress with the indicator
   - Navigate between questions
   - Submit when complete

3. **View Results**
   - See your score with circular visualization
   - Review all questions and your answers
   - Generate new quiz or view history

4. **History**
   - Browse all completed quizzes
   - View statistics and scores
   - Track your progress over time

### Example URLs to Try

**Easy (Short READMEs):**
- `https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md`
- `https://raw.githubusercontent.com/facebook/react/main/README.md`

**Medium (Detailed READMEs):**
- `https://raw.githubusercontent.com/pipecat-ai/pipecat/main/README.md`
- `https://raw.githubusercontent.com/openai/openai-python/main/README.md`

**Advanced (Long Documentation):**
- `https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md`

## Troubleshooting

### Backend won't start

**Error: "API key not configured"**
```bash
# Check your .env file has GROQ_API_KEY set
cat .env | grep GROQ
```

**Error: "Port 3000 already in use"**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Frontend won't connect to backend

**Error: "Failed to generate quiz"**
1. Ensure backend is running on port 3000
2. Check browser console for errors
3. Verify `.env.local` in `quiz-frontend/` has:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Quiz generation is slow

- First quiz takes longer (embedding model loads)
- Typical generation time: 10-30 seconds
- Long documents (>10k chars) take more time
- Check LangSmith for tracing (optional)

### Low quiz quality score

The system enforces 70%+ quality threshold:
- Try URLs with well-structured markdown
- Avoid very short documents (<500 chars)
- GitHub READMEs work best

## Next Steps

### Run Tests
```bash
# Backend tests
npm test

# With coverage
npm test -- --coverage
```

### Production Build
```bash
# Backend
npm run build
npm start -- --server

# Frontend
cd quiz-frontend
npm run build
npm start
```

### Explore Documentation

- `README.md` - Full project documentation
- `CLAUDE.md` - Development guide for Claude Code
- `docs/RAG_TECHNICAL_DECISIONS.md` - RAG pipeline details
- `docs/DEPLOYMENT.md` - Production deployment guide
- `quiz-frontend/README.md` - Frontend documentation

## Key Features to Explore

1. **Quality Evaluation**: Check console logs to see 4-metric evaluation scores
2. **Geometric Scoring**: Later questions weighted higher (1.1^i progression)
3. **Multiple Choice Support**: Some questions allow multiple correct answers
4. **Quiz History**: All sessions saved to SQLite database
5. **RAG Pipeline**: Questions generated from retrieved content chunks

## Performance Tips

- Use raw GitHub URLs (not the UI URLs)
- Shorter documents generate faster
- First run downloads embedding model (~80MB)
- Database stored in `./data/quiz.db`

## Support

- Check logs in terminal for detailed error messages
- Review `CLAUDE.md` for development guidance
- All technical decisions documented in `docs/`

## What's Next?

- Try different document types
- Compare quiz quality across sources
- Review technical documentation
- Explore the scoring algorithm
- Check out the evaluation metrics

Enjoy using the AI Quiz Generator!
