# Quiz Agentic System

Production-ready AI quiz generation system built with DDD, SOLID principles, and comprehensive quality evaluation.

## What Makes This Different

### 1. Real Quality Evaluation (Not Just Logging)
- **Automated quiz quality scoring** across 4 dimensions
- **LLM-as-Judge** integration for expert-level evaluation
- **70%+ quality threshold** enforced before quiz release
- Catches issues like duplicate answers, position bias, content mismatch

### 2. Mathematically Proven Scoring
- **Geometric weight progression** (w = 1.0 × 1.1^i)
- **Partial credit algorithm** for multi-select questions
- **100% test coverage** on scoring logic
- All formulas documented and unit-tested

### 3. Production Architecture
- **DDD** with value objects, entities, aggregates
- **SOLID** principles throughout (Strategy pattern for LLMs)
- **Dependency Injection** via ServiceFactory
- **Zero-downtime deployment** strategy documented

### 4. Defensive RAG Implementation
- **Technical decisions justified** (see `docs/RAG_TECHNICAL_DECISIONS.md`)
- Chunk size (1000 tokens), overlap (200), embedding model all explained
- **Performance benchmarks** included
- No cargo-culting — every choice has a reason

## Core Features

- 🔒 **Security Boundary**: URL sanitization, domain allowlist, input validation
- 🧠 **RAG Pipeline**: Recursive chunking, local embeddings (all-MiniLM-L6-v2), cosine similarity
- 🤖 **LLM Orchestration**: Groq (primary) → OpenAI fallback with unified interface
- 📊 **Geometric Scoring**: Weighted questions with partial credit (formula: Σ(score_i × weight_i) / Σ(weight_i))
- ✅ **Quiz Evaluation**: 4-metric quality system (question quality, answer distribution, difficulty balance, content relevance)
- 💾 **Persistence**: SQLite + Drizzle ORM with type-safe queries
- 📈 **Observability**: LangSmith tracing (optional)
- 🐳 **Docker + Render**: Production deployment ready

## Architecture

```
Input URL → Input Guard → Content Fetcher → RAG Pipeline
                                             ↓
                                          Chunker → Embedder → Vector Store
                                                                    ↓
                                                                 Retriever
                                                                    ↓
Quiz Generator (LLM) → Output Guard → Quiz Runner (CLI)
                                         ↓
                                      Scorer → Database
```

## Quick Start

### Prerequisites

- Node.js 20+
- At least one LLM API key (Groq recommended for free tier)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
```

### Configuration

Edit `.env` file:

```bash
# Required: At least one LLM API key
GROQ_API_KEY=gsk_xxxxx

# Optional: Additional providers for fallback
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional: LangSmith observability
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_xxxxx
```

### Usage

#### Backend API (Server Mode)

```bash
# Start the API server
npm run dev:server

# Server will run on http://localhost:3000
```

#### CLI Mode

```bash
# Development mode
npm run dev -- --url="https://github.com/pipecat-ai/pipecat/blob/main/README.md"

# Production build
npm run build
npm start -- --url="<your-markdown-url>"
```

#### Web Frontend

```bash
# Navigate to frontend directory
cd quiz-frontend

# Install dependencies
npm install

# Start development server (runs on http://localhost:3001)
npm run dev
```

See `quiz-frontend/README.md` for detailed frontend setup instructions.

## Project Structure

```
quiz-agentic-system/
├── src/                      # Backend source code
│   ├── agents/               # LLM agents
│   ├── api/                  # Express REST API
│   ├── guards/               # Input/output validation
│   ├── rag/                  # RAG pipeline components
│   ├── database/             # SQLite persistence
│   ├── evaluation/           # Quiz quality evaluation
│   ├── config/               # Configuration
│   ├── types/                # TypeScript types & schemas
│   └── index.ts              # Main entry point
├── quiz-frontend/            # Next.js web application
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   └── lib/                  # API client and utilities
├── data/                     # SQLite database (gitignored)
├── docs/                     # Technical documentation
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Scoring System (Fully Tested)

### Rules
- **Correct answer**: 4 points
- **Wrong answer**: 0 points
- **Partial credit** (multi-select): `(correct_selections / total_correct) × 4`

### Geometric Weights
Each question has weight: `w_i = 1.0 × (1.1)^i`

**Why geometric progression?**
- Later questions weighted higher (tests sustained attention)
- Ratio of 1.1 balances fairness vs. difficulty curve
- Tested with 80%+ code coverage

### Final Score
```
final_score = Σ(score_i × weight_i) / Σ(weight_i)
```

**Example:**
```
Q1: 4 pts × 1.00 weight = 4.00
Q2: 2 pts × 1.10 weight = 2.20
Q3: 0 pts × 1.21 weight = 0.00
---------------------------------
Total: 6.20 / 3.31 = 1.87 / 4.00 (46.7%)
```

## Quality Evaluation

Every generated quiz is automatically evaluated:

### Metrics (weighted)
1. **Question Quality** (35%): Length, formatting, answer balance
2. **Answer Distribution** (25%): No duplicates, no position bias
3. **Difficulty Balance** (20%): Mix of single/multi-choice
4. **Content Relevance** (20%): Questions match source material

### Pass Threshold
- Overall score ≥ 70%
- Zero critical issues
- Logs detailed warnings for improvement

See: `src/evaluation/QuizEvaluator.ts`

## Testing

### Run Tests
```bash
npm test
```

### Coverage (80%+ required)
```bash
npm test -- --coverage
```

### Test Structure
- **Unit tests**: Value objects, entities, scoring
- **Integration tests**: Question validation, quiz evaluation
- **Property tests**: Geometric progression, partial credit edge cases

### Critical Test Files
- `src/domain/value-objects/__tests__/Score.test.ts` (15 test cases)
- `src/domain/value-objects/__tests__/Weight.test.ts` (12 test cases)
- `src/agents/__tests__/ScorerAgent.test.ts` (18 test cases)
- `src/evaluation/__tests__/QuizEvaluator.test.ts` (10 test cases)

## Documentation

- **RAG Decisions**: `docs/RAG_TECHNICAL_DECISIONS.md`
  - Why 1000 token chunks?
  - Why all-MiniLM-L6-v2 embeddings?
  - Why no vector DB?
  - Performance benchmarks

- **Deployment**: `docs/DEPLOYMENT.md`
  - Zero-downtime strategy
  - Render configuration
  - Rollback procedure
  - Scaling triggers

## Interview Prep: Key Talking Points

### "Why did you choose X?"
All in `docs/RAG_TECHNICAL_DECISIONS.md`:
- Chunk size: 1000 tokens (tested, balances context vs. relevance)
- Overlap: 200 tokens (prevents boundary loss)
- Embedding model: Local, fast, no API cost
- No vector DB: In-memory sufficient for single-doc workflow

### "How do you ensure quality?"
1. **QuizEvaluator**: 4-metric automated system
2. **LLM-as-Judge**: Optional secondary validation
3. **Unit tests**: 80%+ coverage on scoring
4. **Integration tests**: End-to-end quiz validation

### "How would you deploy this?"
See `docs/DEPLOYMENT.md`:
- Render web service with persistent disk
- Blue-green deployment (zero downtime)
- Health checks + graceful shutdown
- Automated backups + rollback procedure

### "What would you improve?"
1. **Eval-driven RAG tuning**: A/B test chunk sizes
2. **LLM-as-Judge in CI**: Block low-quality quizzes
3. **Postgres for horizontal scaling**: SQLite limits at 1 instance
4. **Chunk diversity**: Ensure retrieved chunks aren't too similar

## License

MIT