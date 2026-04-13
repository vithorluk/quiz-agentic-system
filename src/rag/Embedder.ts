import { pipeline } from '@xenova/transformers';
import { Logger } from '../utils/logger.js';
import { TextChunk } from './TextChunker.js';

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

export class Embedder {
  private logger: Logger;
  private model: any;
  private modelName = 'Xenova/all-MiniLM-L6-v2';

  constructor() {
    this.logger = new Logger('Embedder');
  }

  async initialize(): Promise<void> {
    this.logger.info(`Loading embedding model: ${this.modelName}`);

    try {
      this.model = await pipeline('feature-extraction', this.modelName);
      this.logger.success('Embedding model loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load embedding model', error);
      throw error;
    }
  }

  async embed(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
    if (!this.model) {
      await this.initialize();
    }

    this.logger.info(`Embedding ${chunks.length} chunks...`);

    const embeddedChunks: EmbeddedChunk[] = [];

    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.content);

      embeddedChunks.push({
        ...chunk,
        embedding
      });
    }

    this.logger.success(`Successfully embedded ${embeddedChunks.length} chunks`);
    return embeddedChunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
