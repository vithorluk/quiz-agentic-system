export class Url {
  private readonly value: string;

  private constructor(url: string) {
    this.value = url;
  }

  static create(url: string): Url {
    if (!url || url.trim() === '') {
      throw new Error('URL cannot be empty');
    }

    try {
      const parsed = new URL(url);

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }

      return new Url(parsed.href);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid URL: ${error.message}`);
      }
      throw new Error('Invalid URL format');
    }
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return new URL(this.value).hostname;
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
