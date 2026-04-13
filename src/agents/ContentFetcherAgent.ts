import fetch from 'node-fetch';
import { Url } from '../domain/value-objects/Url.js';
import { Logger } from '../utils/logger.js';

export interface ContentFetcherConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  maxContentLength: number;
}

export interface FetchedContent {
  content: string;
  url: Url;
  fetchedAt: Date;
  contentLength: number;
}

export class ContentFetcherAgent {
  private logger: Logger;

  constructor(private config: ContentFetcherConfig) {
    this.logger = new Logger('ContentFetcher');
  }

  async fetch(url: Url): Promise<FetchedContent> {
    this.logger.info(`Fetching content from: ${url.getValue()}`);

    const processedUrl = this.convertToRawUrl(url);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const content = await this.performFetch(processedUrl);
        const truncated = this.truncateContent(content);

        this.logger.success(`Content fetched successfully (${truncated.length} chars)`);

        return {
          content: truncated,
          url,
          fetchedAt: new Date(),
          contentLength: truncated.length
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Fetch attempt ${attempt}/${this.config.maxRetries} failed: ${lastError.message}`);

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed to fetch content after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  private convertToRawUrl(url: Url): string {
    const urlString = url.getValue();

    if (urlString.includes('github.com') && urlString.includes('/blob/')) {
      return urlString.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    return urlString;
  }

  private async performFetch(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Quiz-Agent/1.0',
          'Accept': 'text/markdown, text/plain, text/*, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();

      if (!content || content.trim().length === 0) {
        throw new Error('Fetched content is empty');
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private truncateContent(content: string): string {
    if (content.length <= this.config.maxContentLength) {
      return content;
    }

    this.logger.warn(`Content truncated from ${content.length} to ${this.config.maxContentLength} chars`);
    return content.substring(0, this.config.maxContentLength);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
