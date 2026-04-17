import { TextChunker } from '../../src/rag/TextChunker.js';
import { Embedder } from '../../src/rag/Embedder.js';
import { VectorRetriever } from '../../src/rag/VectorRetriever.js';
import { ServiceFactory } from '../../src/application/ServiceFactory.js';

/**
 * RAG Pipeline Regression Tests
 *
 * These tests validate the Retrieval-Augmented Generation pipeline components
 * to ensure changes don't degrade retrieval quality or introduce performance issues.
 *
 * Test Strategy:
 * - Validate chunking strategy produces reasonable chunks
 * - Ensure embedding quality and consistency
 * - Verify retrieval returns relevant chunks
 * - Check performance characteristics
 */

describe('RAG Pipeline Regression Tests', () => {
  let chunker: TextChunker;
  let embedder: Embedder;
  let retriever: VectorRetriever;

  beforeAll(async () => {
    chunker = ServiceFactory.createTextChunker();
    embedder = ServiceFactory.createEmbedder();
    retriever = ServiceFactory.createVectorRetriever();

    // Initialize embedder once for all tests
    await embedder.initialize();
    await retriever.initialize();
  }, 30000); // Increased timeout for model loading

  afterAll(async () => {
    // Give time for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Text Chunking', () => {
    it('should chunk text with appropriate sizes', () => {
      const sampleText = `
# Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript.
It gives you better tooling at any scale.

## Features

- Type Safety: Catch errors at compile time
- IntelliSense: Better IDE support
- Refactoring: Safer code changes

## Getting Started

Install TypeScript globally:
\`\`\`bash
npm install -g typescript
\`\`\`

Create a tsconfig.json file to configure the compiler.

## Basic Types

TypeScript supports various types including:
- string
- number
- boolean
- array
- tuple
- enum
- any
- void
- null
- undefined

## Interfaces

Interfaces define the structure of objects:
\`\`\`typescript
interface User {
  name: string;
  age: number;
  email?: string;
}
\`\`\`

## Generics

Generics provide reusable type-safe components:
\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
\`\`\`
      `.repeat(5); // Make it longer

      const chunks = chunker.chunk(sampleText);

      expect(chunks.length).toBeGreaterThan(1);

      // Each chunk should be within reasonable bounds
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThan(50);
        expect(chunk.content.length).toBeLessThan(10000);
      });

      // All chunks should have indices
      chunks.forEach((chunk, idx) => {
        expect(chunk.index).toBe(idx);
      });
    });

    it('should respect markdown structure in chunking', () => {
      const markdownText = `
# Main Title

Some introductory content that explains the purpose of this document.

## Section 1

Content for section 1 with detailed information about the topic.

### Subsection 1.1

Details for subsection 1.1 with technical specifications and examples.

## Section 2

Content for section 2 explaining different concepts and approaches.
      `;

      const chunks = chunker.chunk(markdownText);

      // Should produce at least one chunk
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Chunks should preserve content
      const allContent = chunks.map(c => c.content).join(' ');
      expect(allContent).toContain('Main Title');
      expect(allContent).toContain('Section 1');
    });

    it('should handle small content gracefully', () => {
      const smallText = 'This is a small piece of text that should fit in one chunk.';

      const chunks = chunker.chunk(smallText);

      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].content).toContain('small piece of text');
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings for text chunks', async () => {
      const textChunks = [
        { content: 'TypeScript is a typed superset of JavaScript', index: 0 },
        { content: 'Python is a dynamic programming language', index: 1 }
      ];

      const embeddedChunks = await embedder.embed(textChunks);

      expect(embeddedChunks.length).toBe(2);

      embeddedChunks.forEach((chunk, idx) => {
        expect(chunk.content).toBe(textChunks[idx].content);
        expect(chunk.index).toBe(textChunks[idx].index);
        expect(chunk.embedding).toBeDefined();
        expect(chunk.embedding.length).toBe(384); // all-MiniLM-L6-v2 dimension
      });
    });

    it('should generate consistent embeddings for same text', async () => {
      const textChunk = [{ content: 'TypeScript provides static typing', index: 0 }];

      const result1 = await embedder.embed(textChunk);
      const result2 = await embedder.embed(textChunk);

      const embedding1 = result1[0].embedding;
      const embedding2 = result2[0].embedding;

      expect(embedding1.length).toBe(embedding2.length);

      // Should be very similar (allowing for tiny floating point differences)
      for (let i = 0; i < Math.min(10, embedding1.length); i++) {
        expect(Math.abs(embedding1[i] - embedding2[i])).toBeLessThan(0.001);
      }
    });

    it('should generate different embeddings for different text', async () => {
      const chunks = [
        { content: 'TypeScript provides static typing', index: 0 },
        { content: 'Python is a dynamic language', index: 1 }
      ];

      const embeddedChunks = await embedder.embed(chunks);
      const embedding1 = embeddedChunks[0].embedding;
      const embedding2 = embeddedChunks[1].embedding;

      // Calculate cosine similarity using embedder's utility
      const similarity = embedder.cosineSimilarity(embedding1, embedding2);

      // Should be somewhat different (similarity < 0.95)
      expect(similarity).toBeLessThan(0.95);
      expect(similarity).toBeGreaterThan(0); // But still positive correlation
    });

    it('should handle batch embedding efficiently', async () => {
      const chunks = Array.from({ length: 5 }, (_, i) => ({
        content: `Test chunk number ${i} with some content`,
        index: i
      }));

      const startTime = Date.now();
      const embeddedChunks = await embedder.embed(chunks);
      const totalTime = Date.now() - startTime;

      expect(embeddedChunks.length).toBe(5);

      // Should complete in reasonable time (< 1 second for 5 small chunks)
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Vector Retrieval', () => {
    it('should retrieve most relevant chunks', async () => {
      const chunks = [
        { content: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.', index: 0 },
        { content: 'Python is a high-level, interpreted programming language with dynamic typing.', index: 1 },
        { content: 'TypeScript adds optional static types, classes, and interfaces to JavaScript.', index: 2 },
        { content: 'Java is a class-based, object-oriented programming language.', index: 3 },
        { content: 'The TypeScript compiler is called tsc and it checks your code for errors.', index: 4 }
      ];

      const embeddedChunks = await embedder.embed(chunks);
      await retriever.indexChunks(embeddedChunks);

      const results = await retriever.retrieve('What are the features of TypeScript?', 3);

      // Should return exactly 3 results
      expect(results).toHaveLength(3);

      // Top results should be TypeScript-related
      const retrievedIndices = results.map(r => r.chunk.index);

      // Should include TypeScript chunks (0, 2, or 4)
      const hasTypeScriptChunks = retrievedIndices.some(idx => [0, 2, 4].includes(idx));
      expect(hasTypeScriptChunks).toBe(true);

      // Should NOT prioritize Python or Java (indices 1, 3)
      // They might appear if we ask for 3+ results, but shouldn't be first
      expect(results[0].chunk.index).not.toBe(1);
      expect(results[0].chunk.index).not.toBe(3);
    });

    it('should return results sorted by relevance', async () => {
      const chunks = [
        { content: 'Unrelated content about weather and climate patterns', index: 0 },
        { content: 'TypeScript is JavaScript with syntax for types', index: 1 },
        { content: 'TypeScript is a strongly typed programming language that builds on JavaScript', index: 2 }
      ];

      const embeddedChunks = await embedder.embed(chunks);
      await retriever.indexChunks(embeddedChunks);

      const results = await retriever.retrieve('What is TypeScript?', 3);

      // First result should be most relevant (not the weather chunk)
      expect(results[0].chunk.index).toBeGreaterThanOrEqual(1);

      // Scores should be descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should handle queries with no indexed chunks', async () => {
      const newRetriever = ServiceFactory.createVectorRetriever();
      await newRetriever.initialize();

      // Should throw error when no chunks are indexed
      await expect(
        newRetriever.retrieve('What is TypeScript?', 5)
      ).rejects.toThrow('No chunks indexed');
    });
  });

  describe('End-to-End RAG Pipeline', () => {
    it('should process document through full pipeline', async () => {
      const document = `
# Webpack Documentation

Webpack is a static module bundler for modern JavaScript applications.
When webpack processes your application, it builds a dependency graph.

## Core Concepts

### Entry
An entry point indicates which module webpack should use to begin building.

### Output
The output property tells webpack where to emit the bundles it creates.

### Loaders
Loaders allow webpack to process other types of files and convert them.

### Plugins
Plugins can be leveraged to perform a wider range of tasks like bundle optimization.
      `;

      // Create a new retriever for this test
      const testRetriever = ServiceFactory.createVectorRetriever();
      await testRetriever.initialize();

      // Step 1: Chunk the document
      const chunks = chunker.chunk(document);
      expect(chunks.length).toBeGreaterThan(0);

      // Step 2: Generate embeddings
      const embeddedChunks = await embedder.embed(chunks);
      expect(embeddedChunks.length).toBe(chunks.length);

      // Step 3: Index chunks
      await testRetriever.indexChunks(embeddedChunks);

      // Step 4: Search for relevant chunks
      const results = await testRetriever.retrieve('What are the main features of webpack?', 3);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);

      // Retrieved content should be relevant (contain webpack-related terms)
      const retrievedText = results.map(r => r.chunk.content).join(' ').toLowerCase();

      const hasRelevantTerms =
        retrievedText.includes('webpack') ||
        retrievedText.includes('bundle') ||
        retrievedText.includes('module') ||
        retrievedText.includes('entry') ||
        retrievedText.includes('output');

      expect(hasRelevantTerms).toBe(true);
    });
  });

  describe('Cosine Similarity', () => {
    it('should calculate similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const vec3 = [0, 1, 0];

      // Identical vectors
      const sim1 = embedder.cosineSimilarity(vec1, vec2);
      expect(sim1).toBeCloseTo(1.0, 5);

      // Orthogonal vectors
      const sim2 = embedder.cosineSimilarity(vec1, vec3);
      expect(sim2).toBeCloseTo(0.0, 5);

      // Should be symmetric
      const sim3 = embedder.cosineSimilarity(vec3, vec1);
      expect(sim3).toBeCloseTo(sim2, 5);
    });

    it('should handle normalized vectors', () => {
      const vec1 = [0.6, 0.8];
      const vec2 = [0.8, 0.6];

      const similarity = embedder.cosineSimilarity(vec1, vec2);

      // Should be between 0 and 1
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });
});
