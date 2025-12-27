import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../responses/ResponseHandler";

export enum ApiVersion {
  V1 = "v1",
  V2 = "v2",
}

interface VersionedRequest extends Request {
  apiVersion?: ApiVersion;
}

export class ApiVersionMiddleware {
  /**
   * Extract API version from URL path
   * Example: /api/v1/auth/login -> v1
   */
  static extractFromPath() {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;
      const pathParts = req.path.split("/");

      // Look for version in path (e.g., /api/v1/...)
      const versionPart = pathParts.find((part) => /^v\d+$/.test(part));

      if (versionPart) {
        req.apiVersion = versionPart as ApiVersion;
      } else {
        // Default to v1 if no version specified
        req.apiVersion = ApiVersion.V1;
      }

      next();
    };
  }

  /**
   * Extract API version from Accept header
   * Example: Accept: application/vnd.api.v1+json
   */
  static extractFromHeader() {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;
      const acceptHeader = req.headers.accept;

      if (acceptHeader) {
        const versionMatch = acceptHeader.match(/vnd\.api\.(v\d+)/);
        if (versionMatch) {
          req.apiVersion = versionMatch[1] as ApiVersion;
        }
      }

      // Default to v1 if no version specified
      if (!req.apiVersion) {
        req.apiVersion = ApiVersion.V1;
      }

      next();
    };
  }

  /**
   * Validate API version is supported
   */
  static validate(supportedVersions: ApiVersion[]) {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;

      if (!req.apiVersion || !supportedVersions.includes(req.apiVersion)) {
        return ResponseHandler.error(
          res,
          400,
          "UNSUPPORTED_API_VERSION",
          `API version '${req.apiVersion || "unknown"}' is not supported. Supported versions: ${supportedVersions.join(", ")}`,
          { supportedVersions },
          requestId
        );
      }

      next();
    };
  }

  /**
   * Deprecate old API versions
   */
  static deprecate(
    version: ApiVersion,
    sunsetDate: Date,
    migrationGuide?: string
  ) {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      if (req.apiVersion === version) {
        // Add deprecation headers
        res.setHeader("Deprecation", "true");
        res.setHeader("Sunset", sunsetDate.toUTCString());

        if (migrationGuide) {
          res.setHeader("Link", `<${migrationGuide}>; rel="deprecation"`);
        }

        // Add warning in response headers
        res.setHeader(
          "Warning",
          `299 - "API version ${version} is deprecated and will be removed on ${sunsetDate.toDateString()}"`
        );
      }

      next();
    };
  }
}

// Usage example in routes
export function createVersionedRoutes() {
  const router = require("express").Router();

  // Version from path (recommended)
  router.use(ApiVersionMiddleware.extractFromPath());

  // Validate supported versions
  router.use(ApiVersionMiddleware.validate([ApiVersion.V1, ApiVersion.V2]));

  // Deprecate v1 (example)
  router.use(
    ApiVersionMiddleware.deprecate(
      ApiVersion.V1,
      new Date("2026-12-31"),
      "https://docs.example.com/migration-v2"
    )
  );

  return router;
}
