import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
});

export function configureLogger(config: { level?: string; file?: string; maxSize?: string; maxFiles?: number }): void {
  if (config.level) {
    logger.level = config.level;
  }

  if (config.file) {
    const fileTransport = new winston.transports.File({
      filename: config.file,
      maxsize: parseSize(config.maxSize || '10m'),
      maxFiles: config.maxFiles || 5,
    });
    logger.add(fileTransport);
  }
}

function parseSize(size: string): number {
  const match = size.match(/^(\d+)(k|m|g)?$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const num = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();

  switch (unit) {
    case 'k': return num * 1024;
    case 'm': return num * 1024 * 1024;
    case 'g': return num * 1024 * 1024 * 1024;
    default: return num;
  }
}
