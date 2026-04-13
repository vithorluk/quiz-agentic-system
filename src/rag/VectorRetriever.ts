import { Logger } from '../utils/logger.js';
import { Embedder, EmbeddedChunk } from './Embedder.js';

export interface RetrievalResult {
  chunk: EmbeddedChunk;
  score: number;
}

export class VectorRetriever {
  private logger: Logger;
  private embedder: Embedder;
  private chunks: EmbeddedChunk[] = [];

  constructor() {
    this.logger = new Logger('VectorRetriever');
    this.embedder = new Embedder();
  }

  async initialize(): Promise<void> {
    await this.embedder.initialize();
  }

  async indexChunks(chunks: EmbeddedChunk[]): Promise<void> {
    this.logger.info(`Indexing ${chunks.length} chunks...`);
    this.chunks = chunks;
    this.logger.success(`Indexed ${this.chunks.length} chunks`);
  }

  async retrieve(query: string, topK: number): Promise<RetrievalResult[]> {
    if (this.chunks.length === 0) {
      throw new Error('No chunks indexed. Call indexChunks first.');
    }

    this.logger.info(`Retrieving top ${topK} chunks for query: "${query.substring(0, 50)}..."`);

    const queryEmbedding = await this.embedder.embed([{
      content: query,
      index: -1
    }]);

    const results: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      const score = this.embedder.cosineSimilarity(
        queryEmbedding[0].embedding,
        chunk.embedding
      );

      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);

    const topResults = results.slice(0, topK);

    this.logger.success(`Retrieved ${topResults.length} chunks (avg score: ${this.getAverageScore(topResults).toFixed(3)})`);

    return topResults;
  }

  private getAverageScore(results: RetrievalResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return sum / results.length;
  }

  getAllChunks(): EmbeddedChunk[] {
    return this.chunks;
  }
}
