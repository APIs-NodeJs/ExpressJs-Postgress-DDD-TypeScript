import { Request, Response } from "express";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import {
  getCorsConfig,
  enableCors,
  disableCors,
  setCorsOrigins,
  addCorsOrigin,
  removeCorsOrigin,
  resetCorsConfig,
} from "@infrastructure/http/middlewares/cors";

export class CorsController {
  /**
   * Get current CORS configuration
   */
  getConfig = async (req: Request, res: Response): Promise<Response> => {
    try {
      const config = getCorsConfig();
      return ApiResponse.success(res, config);
    } catch (error) {
      console.error("Get CORS config error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Enable CORS
   */
  enable = async (req: Request, res: Response): Promise<Response> => {
    try {
      enableCors();
      return ApiResponse.success(res, {
        message: "CORS enabled successfully",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Enable CORS error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Disable CORS
   */
  disable = async (req: Request, res: Response): Promise<Response> => {
    try {
      disableCors();
      return ApiResponse.success(res, {
        message: "CORS disabled successfully",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Disable CORS error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Update CORS origins
   */
  updateOrigins = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { origins } = req.body;

      if (!Array.isArray(origins)) {
        return ApiResponse.badRequest(res, "Origins must be an array");
      }

      // Validate origins
      for (const origin of origins) {
        if (typeof origin !== "string") {
          return ApiResponse.badRequest(res, "All origins must be strings");
        }
      }

      setCorsOrigins(origins);

      return ApiResponse.success(res, {
        message: "CORS origins updated successfully",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Update CORS origins error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Add a CORS origin
   */
  addOrigin = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { origin } = req.body;

      if (!origin || typeof origin !== "string") {
        return ApiResponse.badRequest(res, "Origin must be a string");
      }

      addCorsOrigin(origin);

      return ApiResponse.success(res, {
        message: "CORS origin added successfully",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Add CORS origin error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Remove a CORS origin
   */
  removeOrigin = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { origin } = req.params;

      if (!origin) {
        return ApiResponse.badRequest(res, "Origin is required");
      }

      removeCorsOrigin(decodeURIComponent(origin));

      return ApiResponse.success(res, {
        message: "CORS origin removed successfully",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Remove CORS origin error:", error);
      return ApiResponse.internalError(res);
    }
  };

  /**
   * Reset CORS to default configuration
   */
  reset = async (req: Request, res: Response): Promise<Response> => {
    try {
      resetCorsConfig();

      return ApiResponse.success(res, {
        message: "CORS configuration reset to defaults",
        config: getCorsConfig(),
      });
    } catch (error) {
      console.error("Reset CORS error:", error);
      return ApiResponse.internalError(res);
    }
  };
}
