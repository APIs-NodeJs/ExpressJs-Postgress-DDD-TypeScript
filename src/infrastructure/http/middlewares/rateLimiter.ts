import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { config } from "@config/env";
import { ApiResponse } from "../responses/ApiResponse";
export const rateLimiter: RequestHandler = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests, please try again later",
      429
    );
  },
});
