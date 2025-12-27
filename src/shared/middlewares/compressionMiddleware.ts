import { Request, Response } from "express";
import compression from "compression";
/**
 * Smart compression middleware
 * Compresses responses when beneficial
 */
export const compressionMiddleware = compression({
  // Compression level (0-9, higher = better compression but slower)
  level: 6,

  // Only compress responses larger than this (in bytes)
  threshold: 1024, // 1KB

  // Filter function - decide what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }

    // Don't compress Server-Sent Events
    if (res.getHeader("Content-Type") === "text/event-stream") {
      return false;
    }

    // Don't compress already compressed content
    const contentType = res.getHeader("Content-Type") as string;
    if (contentType) {
      const compressedTypes = [
        "image/",
        "video/",
        "audio/",
        "application/zip",
        "application/gzip",
        "application/x-rar",
      ];

      if (compressedTypes.some((type) => contentType.includes(type))) {
        return false;
      }
    }

    // Use default compression filter
    return compression.filter(req, res);
  },

  // Memory level (1-9, higher = more memory but better compression)
  memLevel: 8,
});

/**
 * Add this to package.json:
 * npm install compression @types/compression
 */
