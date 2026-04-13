import { Url } from '../domain/value-objects/Url.js';
import { Logger } from '../utils/logger.js';

export interface InputGuardConfig {
  allowedDomains: string[];
  allowedSchemes: string[];
}

export class InputGuard {
  private logger: Logger;

  constructor(private config: InputGuardConfig) {
    this.logger = new Logger('InputGuard');
  }

  async validate(rawUrl: string): Promise<Url> {
    this.logger.info(`Validating URL: ${rawUrl}`);

    const url = Url.create(rawUrl);

    this.validateScheme(url);
    this.validateDomain(url);
    this.sanitizeUrl(url);

    this.logger.success('URL validation passed');
    return url;
  }

  private validateScheme(url: Url): void {
    const urlObj = new URL(url.getValue());
    const scheme = urlObj.protocol.replace(':', '');

    if (!this.config.allowedSchemes.includes(scheme)) {
      throw new Error(
        `URL scheme "${scheme}" not allowed. Allowed schemes: ${this.config.allowedSchemes.join(', ')}`
      );
    }
  }

  private validateDomain(url: Url): void {
    const domain = url.getDomain();

    const isAllowed = this.config.allowedDomains.some(allowed => {
      if (allowed.startsWith('*.')) {
        const suffix = allowed.substring(2);
        return domain === suffix || domain.endsWith(`.${suffix}`);
      }
      return domain === allowed;
    });

    if (!isAllowed) {
      throw new Error(
        `Domain "${domain}" not in allowlist. Allowed domains: ${this.config.allowedDomains.join(', ')}`
      );
    }
  }

  private sanitizeUrl(url: Url): void {
    const urlObj = new URL(url.getValue());

    const dangerousPatterns = [
      '../',
      '..\\',
      '%2e%2e',
      '%252e%252e'
    ];

    const fullUrl = url.getValue().toLowerCase();

    for (const pattern of dangerousPatterns) {
      if (fullUrl.includes(pattern.toLowerCase())) {
        throw new Error(`URL contains potentially dangerous pattern: ${pattern}`);
      }
    }

    if (urlObj.username || urlObj.password) {
      throw new Error('URL must not contain credentials');
    }
  }
}
