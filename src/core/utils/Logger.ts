import { config } from '../../shared/config/env.config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

export class Logger {
  private context: string;
  private currentLogLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    this.currentLogLevel = LOG_LEVEL_MAP[config.LOG_LEVEL] ?? LogLevel.INFO;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.currentLogLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, meta);
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.currentLogLevel <= LogLevel.INFO) {
      this.log('INFO', message, meta);
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.currentLogLevel <= LogLevel.WARN) {
      this.log('WARN', message, meta);
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.currentLogLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, meta);
    }
  }

  private log(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(meta && Object.keys(meta).length > 0 && { meta }),
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'DEBUG':
      case 'INFO':
        console.log(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  }
}