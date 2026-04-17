# Evaluation Regression Tests

This directory contains evaluation regression tests that validate the quality and consistency of the quiz generation system over time.

## Purpose

Unlike unit tests that test individual components in isolation, these tests:

1. **Validate end-to-end quality** - Test the entire pipeline from URL to quiz with real documents
2. **Prevent quality regressions** - Ensure changes don't degrade quiz quality metrics
3. **Test with real data** - Use actual markdown documents from public repositories
4. **Monitor RAG pipeline** - Verify chunking, embedding, and retrieval work correctly
5. **Check for common failures** - Test for duplicate questions, answer bias, poor difficulty distribution

## Test Structure

### `run-evals.ts`
Main test runner that executes all evaluation tests:
- **Standalone runner**: Uses tsx directly instead of Jest to avoid issues with @xenova/transformers
- **Real LLM calls**: Makes actual API calls for quiz quality tests (requires API keys)
- **Custom assertions**: Simple assertion library for test validation
- **Progress reporting**: Shows test progress and summary with clear pass/fail indicators
- **Selective execution**: Can run specific test suites via command line arguments

### Test Suites

#### Quiz Quality Tests (`testQuizQuality`)
Tests end-to-end quiz generation with real LLM calls:
- **Technical Documentation**: Validates high-quality quiz generation from well-structured READMEs
- **No Duplicates**: Ensures questions are unique
- **Difficulty Distribution**: Validates mix of single and multi-choice questions
- **Quality Metrics**: Checks evaluation scores meet thresholds (≥70 overall, ≥60 per metric)

**Requirements**: Requires `GROQ_API_KEY` or `OPENAI_API_KEY` environment variable

#### RAG Pipeline Tests (`testRAGPipeline`)
Tests the Retrieval-Augmented Generation pipeline:
- **Text Chunking**: Validates chunking strategy and size constraints
- **Embedding Generation**: Tests embedding consistency and dimensions (384 for all-MiniLM-L6-v2)
- **Vector Retrieval**: Validates relevance ranking and retrieval accuracy
- **End-to-End RAG**: Tests full pipeline from document to retrieved chunks

**Requirements**: No API keys needed (uses local embedding model)

### Legacy Jest Tests (Optional)

- `quiz-quality.test.ts`: Jest format tests for quiz quality
- `rag-pipeline.test.ts`: Jest format tests for RAG pipeline

**Note**: Jest tests may have issues with @xenova/transformers due to dynamic imports. The standalone runner (`run-evals.ts`) is recommended.

## Running Tests

```bash
# Run all evaluation regression tests
npm run eval:regression

# Run only RAG pipeline tests (no API key needed)
npm run eval:regression -- --test=rag-pipeline

# Run only quiz quality tests (requires API key)
npm run eval:regression -- --test=quiz-quality

# Alternative: Run with Jest (may have module resolution issues)
npm run eval:jest
```

## Environment Setup

For quiz quality tests, set one of these environment variables:

```bash
# Groq (recommended - fast and free tier)
export GROQ_API_KEY=gsk_xxxxx

# OpenAI (fallback)
export OPENAI_API_KEY=sk-xxxxx

# Anthropic (fallback)
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

RAG pipeline tests don't require any API keys.

## Test Output

Tests provide detailed output including:
- ▶ Test execution progress
- ✓ Pass indicators with duration
- ✗ Fail indicators with error details
- Logging from RAG components (chunking, embedding, retrieval)
- Final summary with total/passed/failed counts

Example output:
```
================================================================================
RAG Pipeline Regression Tests
================================================================================
Initializing RAG components...
✓ RAG components initialized

▶ Running: should chunk text with appropriate sizes
✓ Passed: should chunk text with appropriate sizes (0ms)

▶ Running: should generate embeddings for text chunks
✓ Passed: should generate embeddings for text chunks (6ms)

================================================================================
TEST SUMMARY
================================================================================
Total: 4 tests
✓ Passed: 4
✗ Failed: 0
Duration: 1441ms

✓ All tests passed!
```

## Quality Thresholds

Tests enforce these minimum quality standards:

### Quiz Quality Tests:
- **Overall Quiz Score**: ≥ 65% (0-100 scale, with warnings < 70%)
- **Question Quality**: ≥ 60%
- **Answer Distribution**: ≥ 60%
- **Difficulty Balance**: ≥ 50%
- **Content Relevance**: ≥ 60%
- **Question Count**: 5-8 questions
- **Answers per Question**: Exactly 4
- **Single Choice Ratio**: ≥ 20% (ensures difficulty variation)

**Note**: Thresholds are slightly lenient to account for LLM variability. Tests will warn if scores are between 65-70%.

### RAG Pipeline Tests:
- **Embedding Dimensions**: Exactly 384 (all-MiniLM-L6-v2)
- **Chunk Size**: > 50 chars, < 10000 chars
- **Retrieval Relevance**: Top results should match query topic

## Retry Logic

Quiz quality tests include automatic retry logic to handle:
- **LLM API failures**: Network errors, rate limits
- **Validation errors**: Quiz doesn't meet entity constraints
- **Low evaluation scores**: Quiz fails quality thresholds

Each test retries up to 3 times with informative logging:
```
⚠ Attempt 1 failed evaluation (score: 62), retrying...
⚠ Attempt 2 failed: Multiple choice question must have more than one correct answer, retrying...
✓ Passed on attempt 3
```

## Adding New Tests

To add a new test to `run-evals.ts`:

```typescript
await runTest('your test name', async () => {
  // Your test code
  const result = await someOperation();

  // Use assertion helpers
  assert(result !== null, 'Result should not be null');
  assertGreaterThanOrEqual(result.score, 70, 'Score should be >= 70');
  assertEqual(result.type, 'expected', 'Type should match');
});
```

Available assertion helpers:
- `assert(condition, message)`: Basic assertion
- `assertEqual(actual, expected, message)`: Equality check
- `assertGreaterThan(actual, threshold, message)`: Greater than check
- `assertGreaterThanOrEqual(actual, threshold, message)`: Greater or equal check
- `assertLessThan(actual, threshold, message)`: Less than check

## CI/CD Integration

These tests should be run:

- **Before merging PRs**: Ensure no quality regressions
- **After prompt changes**: Validate impact on quiz quality
- **After RAG changes**: Ensure retrieval quality is maintained
- **Scheduled runs**: Daily or weekly to catch model drift

### Recommended CI Setup

```yaml
# Run fast tests (RAG pipeline only)
npm run eval:regression -- --test=rag-pipeline

# Run full tests with API key
GROQ_API_KEY=${{ secrets.GROQ_API_KEY }} npm run eval:regression
```

## Performance Benchmarks

Expected test durations:
- **RAG Pipeline Tests**: 1-2 seconds (no LLM calls)
- **Quiz Quality Tests**: 30-90 seconds each (includes LLM calls and network)
- **Full Suite**: 2-5 minutes

If tests are significantly slower:
- Check LLM API latency
- Verify network connectivity
- Check embedding model initialization (first run downloads model)

## Troubleshooting

### Module Resolution Errors
If you see "Cannot find module" errors with langsmith:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Jest Teardown Errors
If using `eval:jest` and seeing "Jest environment has been torn down":
- Use `npm run eval:regression` instead (recommended)
- The standalone runner avoids Jest's issues with @xenova/transformers

### API Key Errors
If quiz quality tests fail with authentication errors:
- Verify API key is set: `echo $GROQ_API_KEY`
- Check API key is valid and has credits
- Try fallback provider (OpenAI or Anthropic)

### Embedding Model Download
First run downloads the embedding model (~90MB):
- Model is cached in `~/.cache/huggingface`
- Subsequent runs use cached model
- Internet connection required for first run

## Future Improvements

Potential additions to the test suite:

1. **Snapshot testing**: Compare quiz outputs to known-good snapshots
2. **LLM-as-Judge tests**: Use secondary LLM to evaluate quiz quality
3. **Performance regression tests**: Track latency over time
4. **Multi-language tests**: Validate non-English document support
5. **Edge case tests**: Very short docs, very long docs, code-heavy docs
6. **Stress tests**: High concurrency, rate limiting validation
