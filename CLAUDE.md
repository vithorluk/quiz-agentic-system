# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered quiz generation system that converts Markdown documents into interactive quizzes with automated quality evaluation, RAG pipeline, and geometric scoring. Built with DDD principles, SOLID patterns, and production-ready deployment strategy.

## Development Commands

### Build & Run
```bash
# Development mode (CLI)
npm run dev -- --url="https://github.com/user/repo/blob/main/README.md"

# Development mode (server)
npm run dev:server

# Production build
npm run build
npm start -- --url="<url>"
```

### Testing
```bash
# Run all tests
npm test

# Watch mode (for TDD)
npm run test:watch

# Coverage report (80%+ required)
npm run test:coverage
```

### Linting
```bash
npm run lint
```

## Architecture Overview

### Core Pipeline Flow
```
URL Input → InputGuard → ContentFetcher → RAG Pipeline → QuizGenerator → QuizEvaluator → QuizRunner → ScorerAgent → Database
```

### Domain-Driven Design Structure

**Value Objects** (`src/domain/value-objects/`):
- `Url.ts`: URL validation with allowlist enforcement
- `Score.ts`: Immutable score with validation (0-4 points)
- `Weight.ts`: Geometric progression weights (w = 1.0 × 1.1^i)

**Entities** (`src/domain/entities/`):
- `Question.ts`: Quiz question with validation logic
- `Quiz.ts`: Aggregate root for quiz questions
- `QuizAnswer.ts`: User answer tracking
- `QuizSession.ts`: Complete quiz session with metadata

**Key Principle**: Value objects are immutable with rich behavior. Entities have identity and lifecycle.

### Dependency Injection

All dependencies are wired through `ServiceFactory` (`src/application/ServiceFactory.ts`). This is the single source of truth for object creation.

**To add a new service:**
1. Create the service class
2. Add factory method to `ServiceFactory`
3. Wire dependencies explicitly (no magic DI framework)

### RAG Pipeline Components

**TextChunker** (`src/rag/TextChunker.ts`):
- Recursive text splitting with markdown awareness
- Default: 1000 tokens, 200 token overlap
- See `docs/RAG_TECHNICAL_DECISIONS.md` for justification

**Embedder** (`src/rag/Embedder.ts`):
- Uses `Xenova/all-MiniLM-L6-v2` (384 dimensions)
- Local execution, no API calls
- ~20ms per chunk on CPU

**VectorRetriever** (`src/rag/VectorRetriever.ts`):
- In-memory cosine similarity search
- No vector DB needed for single-document workflow
- Default: top-5 chunks

### LLM Orchestration

**Strategy Pattern** (`src/llm/`):
- `LLMProvider`: Interface for all providers
- `GroqProvider`: Primary (fast, free tier)
- `OpenAIProvider`: Fallback
- `LLMOrchestrator`: Handles provider switching and retries

**To add a new LLM provider:**
1. Implement `LLMProvider` interface
2. Add to `LLMOrchestrator.providers` array
3. Set API key in `.env`

### Quality Evaluation System

**QuizEvaluator** (`src/evaluation/QuizEvaluator.ts`):
- 4-metric weighted scoring:
  - Question Quality (35%): Length, formatting, answer balance
  - Answer Distribution (25%): Duplicates, position bias
  - Difficulty Balance (20%): Single vs multi-choice ratio
  - Content Relevance (20%): Keyword matching with source
- 70% threshold required to pass
- Logs detailed issues/warnings

**LLMAsJudge** (`src/evaluation/LLMAsJudge.ts`):
- Optional secondary validation using LLM
- Provides qualitative feedback
- Use when automated metrics aren't sufficient

### Scoring Algorithm

**Implementation**: `src/agents/ScorerAgent.ts`

**Rules**:
- Correct answer: 4 points
- Wrong answer: 0 points
- Partial credit (multi-select): `(correct_selections / total_correct) × 4`

**Geometric Weights**:
```
w_i = 1.0 × (1.1)^i
```

**Final Score**:
```
final_score = Σ(score_i × weight_i) / Σ(weight_i)
```

**Why geometric progression?**
- Later questions weighted higher (sustained attention)
- Ratio of 1.1 balances fairness vs difficulty curve
- Fully tested with 18 test cases in `src/agents/__tests__/ScorerAgent.test.ts`

## Database Schema

SQLite + Drizzle ORM (`src/database/schema.ts`):
- `quiz_sessions`: Quiz metadata
- `quiz_answers`: User answer tracking
- `quiz_questions`: Question content (denormalized for performance)

**Migration strategy**: Always backward-compatible. See `docs/DEPLOYMENT.md` for zero-downtime requirements.

## Testing Strategy

### Coverage Requirements
- Minimum 80% across branches, functions, lines, statements
- Configured in `jest.config.js`

### Critical Test Files
- `src/domain/value-objects/__tests__/Score.test.ts`: Score validation
- `src/domain/value-objects/__tests__/Weight.test.ts`: Geometric progression
- `src/agents/__tests__/ScorerAgent.test.ts`: Scoring algorithm (18 cases)
- `src/evaluation/__tests__/QuizEvaluator.test.ts`: Quality evaluation

### Test Patterns
- **Unit tests**: Value objects, scoring logic, individual agents
- **Integration tests**: Full pipeline validation, quiz evaluation
- **Property tests**: Mathematical invariants (e.g., weight progression)

**When adding new features**: Add corresponding tests first (TDD). Use `npm run test:watch`.

## Configuration

### Environment Variables (`.env`)
```bash
# Required: At least one LLM API key
GROQ_API_KEY=gsk_xxxxx

# Optional: Fallback providers
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional: Observability
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_xxxxx

# Database
DATABASE_PATH=./data/quiz.db
```

### Config Files
- `src/config/index.ts`: Central configuration with validation
- `tsconfig.json`: ES2022, ESNext modules, strict mode
- `jest.config.js`: ESM support with ts-jest

## Common Development Tasks

### Adding a New Question Type
1. Update `Question` entity validation (`src/domain/entities/Question.ts`)
2. Update scoring logic in `ScorerAgent` if needed
3. Add test cases for new type
4. Update `QuizEvaluator` metrics if behavior differs

### Modifying RAG Parameters
1. Update `src/config/index.ts` defaults
2. Document decision in `docs/RAG_TECHNICAL_DECISIONS.md`
3. Run evaluation on sample docs to verify quality
4. Update tests if behavior changes

### Adding New Evaluation Metrics
1. Add metric to `EvaluationMetrics` interface in `QuizEvaluator.ts`
2. Implement evaluation method (private)
3. Add to weighted score calculation in `evaluate()`
4. Add test cases in `src/evaluation/__tests__/QuizEvaluator.test.ts`

## Technical Decisions Documentation

**RAG Pipeline**: `docs/RAG_TECHNICAL_DECISIONS.md`
- Why 1000 token chunks?
- Why all-MiniLM-L6-v2 embeddings?
- Why no vector DB?
- Performance benchmarks

**Deployment**: `docs/DEPLOYMENT.md`
- Zero-downtime strategy (blue-green)
- Render configuration
- Rollback procedure
- Scaling triggers

## Production Deployment

### Render Deployment
```bash
# Environment: Docker
# Build Command: (uses Dockerfile)
# Start Command: node dist/index.js --server
# Health Check: /health
```

### Critical for Zero-Downtime
1. Health endpoint must respond quickly (`/health`)
2. Database migrations must be backward-compatible only
3. Graceful shutdown handler for SIGTERM
4. Connection draining (30s timeout)

### Scaling Considerations
- **SQLite limitation**: Single writer, use PostgreSQL for horizontal scaling
- **Memory**: Embedding model needs ~200MB minimum
- **Triggers**: Scale at CPU >70%, queue >50, p95 latency >5s

## Code Style & Patterns

### SOLID Principles
- **Single Responsibility**: Each class has one clear purpose
- **Open/Closed**: Use interfaces (e.g., `LLMProvider`) for extensibility
- **Liskov Substitution**: All LLM providers are interchangeable
- **Interface Segregation**: Focused interfaces (`EvaluationConfig`, `LLMProvider`)
- **Dependency Inversion**: `ServiceFactory` handles all dependencies

### Naming Conventions
- **Agents**: `*Agent.ts` for LLM-interacting components
- **Value Objects**: Immutable, validated data holders
- **Entities**: Mutable objects with identity
- **Services**: Stateless operation handlers

### Error Handling
- Validation errors throw immediately
- Network errors retry with exponential backoff
- LLM failures cascade through provider list
- All errors logged with context

## Known Limitations & Future Improvements

### Current Limitations
- SQLite single-writer (no horizontal scaling)
- In-memory vectors (not suitable for multi-document knowledge base)
- No chunk diversity enforcement (retrieved chunks may be similar)

### Prioritized Improvements
1. **High**: Eval-driven RAG tuning (A/B test chunk sizes)
2. **High**: LLM-as-Judge in CI (block low-quality quizzes)
3. **Medium**: PostgreSQL for multi-instance support
4. **Medium**: Chunk diversity scoring (MMR/diversification)
5. **Low**: Reranking with cross-encoder (adds latency)

See `docs/RAG_TECHNICAL_DECISIONS.md` for full justifications.

## Debugging Tips

### RAG Pipeline Issues
- Check chunk count: Should be 5-15 for typical READMEs
- Check retrieval scores: Top chunks should have >0.5 similarity
- Enable LangSmith tracing for LLM call inspection

### Quiz Quality Issues
- Review `QuizEvaluator` logs for specific metric failures
- Use `LLMAsJudge` for qualitative feedback
- Check source content length (truncated at 12k chars)

### Test Failures
- Run `npm run test:coverage` to identify untested paths
- Check `jest.config.js` for ESM-related issues
- Use `npm run test:watch` for rapid iteration

## Additional Resources

- **README.md**: User-facing documentation with examples
- **PROJECT_SUMMARY.md**: Interview prep and key talking points
- **docs/RAG_TECHNICAL_DECISIONS.md**: Deep dive on RAG choices
- **docs/DEPLOYMENT.md**: Production deployment guide
