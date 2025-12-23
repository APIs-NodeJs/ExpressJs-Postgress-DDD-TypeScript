import compression from "compression";
import { Request, Response } from "express";

/**
 * Compression middleware configuration
 * Compresses response bodies for all requests
 */
export const compressionMiddleware = compression({
  // Filter function to decide what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },

  // Compression level (0-9)
  // 6 is a good balance between compression ratio and speed
  level: 6,

  // Minimum response size to compress (in bytes)
  threshold: 1024, // 1KB

  // Memory level (1-9)
  memLevel: 8,

  // Compression strategy
  strategy: compression.Z_DEFAULT_STRATEGY,
});
