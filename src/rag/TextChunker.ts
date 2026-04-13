import { Logger } from '../utils/logger.js';

export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface TextChunk {
  content: string;
  index: number;
  heading?: string;
}

export class TextChunker {
  private logger: Logger;

  constructor(private config: ChunkConfig) {
    this.logger = new Logger('TextChunker');
  }

  chunk(content: string): TextChunk[] {
    this.logger.info('Starting text chunking...');

    const sections = this.extractSections(content);
    const chunks: TextChunk[] = [];

    let index = 0;

    for (const section of sections) {
      const sectionChunks = this.chunkSection(section.content, section.heading);

      for (const chunk of sectionChunks) {
        chunks.push({
          ...chunk,
          index: index++
        });
      }
    }

    this.logger.success(`Created ${chunks.length} chunks`);
    return chunks;
  }

  private extractSections(content: string): Array<{ heading?: string; content: string }> {
    const lines = content.split('\n');
    const sections: Array<{ heading?: string; content: string }> = [];

    let currentHeading: string | undefined;
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        if (currentContent.length > 0) {
          sections.push({
            heading: currentHeading,
            content: currentContent.join('\n')
          });
          currentContent = [];
        }

        currentHeading = headingMatch[2].trim();
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentContent.join('\n')
      });
    }

    return sections.filter(s => s.content.trim().length > 0);
  }

  private chunkSection(content: string, heading?: string): Omit<TextChunk, 'index'>[] {
    const tokens = content.split(/\s+/);
    const chunks: Omit<TextChunk, 'index'>[] = [];

    if (tokens.length === 0) {
      return chunks;
    }

    let start = 0;

    while (start < tokens.length) {
      const end = Math.min(start + this.config.chunkSize, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      const chunkContent = chunkTokens.join(' ');

      chunks.push({
        content: chunkContent,
        heading
      });

      if (end >= tokens.length) {
        break;
      }

      start = end - this.config.chunkOverlap;

      if (start >= tokens.length - this.config.chunkOverlap) {
        break;
      }
    }

    return chunks;
  }
}
