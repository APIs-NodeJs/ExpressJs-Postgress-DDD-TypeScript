// src/shared/config/ConfigValidator.ts
import { config } from './env.config';
import { Logger } from '../../core/utils/Logger';

const logger = new Logger('ConfigValidator');

export class ConfigValidator {
  /**
   * Validate all critical configuration on startup
   */
  static validate(): void {
    logger.info('Validating configuration...');

    const errors: string[] = [];

    // JWT Configuration
    errors.push(...this.validateJWT());

    // Database Configuration
    errors.push(...this.validateDatabase());

    // Security Configuration
    errors.push(...this.validateSecurity());

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(
        `Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
      );
    }

    logger.info('✅ Configuration validation passed');
  }

  /**
   * Validate JWT configuration
   */
  private static validateJWT(): string[] {
    const errors: string[] = [];

    // JWT Secret
    if (!config.JWT_SECRET) {
      errors.push('JWT_SECRET is not configured');
    } else if (config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    // JWT Expiration
    if (!config.JWT_EXPIRES_IN) {
      errors.push('JWT_EXPIRES_IN is not configured');
    } else if (!this.isValidDuration(config.JWT_EXPIRES_IN)) {
      errors.push(
        `JWT_EXPIRES_IN has invalid format: "${config.JWT_EXPIRES_IN}". ` +
          'Expected format: number + unit (e.g., "15m", "1h", "7d")'
      );
    }

    // Refresh Token Secret
    if (!config.JWT_REFRESH_SECRET) {
      errors.push('JWT_REFRESH_SECRET is not configured');
    } else if (config.JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
    }

    // Refresh Token Expiration
    if (!config.JWT_REFRESH_EXPIRES_IN) {
      errors.push('JWT_REFRESH_EXPIRES_IN is not configured');
    } else if (!this.isValidDuration(config.JWT_REFRESH_EXPIRES_IN)) {
      errors.push(
        `JWT_REFRESH_EXPIRES_IN has invalid format: "${config.JWT_REFRESH_EXPIRES_IN}". ` +
          'Expected format: number + unit (e.g., "15m", "1h", "7d")'
      );
    }

    // Security: Secrets should be different
    if (
      config.JWT_SECRET &&
      config.JWT_REFRESH_SECRET &&
      config.JWT_SECRET === config.JWT_REFRESH_SECRET
    ) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    return errors;
  }

  /**
   * Validate database configuration
   */
  private static validateDatabase(): string[] {
    const errors: string[] = [];

    if (!config.DB_HOST) {
      errors.push('DB_HOST is not configured');
    }

    if (!config.DB_NAME) {
      errors.push('DB_NAME is not configured');
    }

    if (!config.DB_USER) {
      errors.push('DB_USER is not configured');
    }

    if (!config.DB_PASSWORD) {
      errors.push('DB_PASSWORD is not configured');
    }

    if (config.DB_PORT < 1 || config.DB_PORT > 65535) {
      errors.push(`DB_PORT must be between 1 and 65535, got: ${config.DB_PORT}`);
    }

    return errors;
  }

  /**
   * Validate security configuration
   */
  private static validateSecurity(): string[] {
    const errors: string[] = [];

    // CORS Origins
    if (!config.ALLOWED_ORIGINS) {
      errors.push('ALLOWED_ORIGINS is not configured');
    }

    // Production-specific checks
    if (config.NODE_ENV === 'production') {
      // In production, should not allow all origins
      if (config.ALLOWED_ORIGINS === '*') {
        errors.push('ALLOWED_ORIGINS should not be "*" in production');
      }

      // Should use strong secrets in production
      if (config.JWT_SECRET && config.JWT_SECRET.includes('your-')) {
        errors.push('JWT_SECRET appears to be a placeholder value in production');
      }

      if (config.JWT_REFRESH_SECRET && config.JWT_REFRESH_SECRET.includes('your-')) {
        errors.push('JWT_REFRESH_SECRET appears to be a placeholder value in production');
      }
    }

    return errors;
  }

  /**
   * Validate duration string format (e.g., "15m", "1h", "7d")
   */
  static isValidDuration(value: string): boolean {
    // Valid formats: 60 (seconds), "60s", "15m", "1h", "7d"

    // If it's a number string, it's valid (represents seconds)
    if (/^\d+$/.test(value)) {
      return true;
    }

    // If it's number + unit
    const durationRegex = /^(\d+)(ms|s|m|h|d)$/;
    return durationRegex.test(value);
  }

  /**
   * Parse duration string to seconds
   */
  static parseDuration(value: string): number {
    // If it's just a number, return as-is (seconds)
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    const match = value.match(/^(\d+)(ms|s|m|h|d)$/);

    if (!match) {
      throw new Error(`Invalid duration format: ${value}`);
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'ms':
        return Math.floor(amount / 1000);
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }
}
