// src/modules/auth/presentation/routes/authRoutes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/AuthController";
import { validate } from "../../../../infrastructure/http/middlewares/validate";
import { authenticate } from "../../../../infrastructure/http/middlewares/authenticate";
import { asyncHandler } from "../../../../infrastructure/http/middlewares/asyncHandler";
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
} from "../../infrastructure/validators/authValidators";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { WorkspaceRepository } from "../../infrastructure/repositories/WorkspaceRepository";
import { PasswordHasher } from "../../infrastructure/security/PasswordHasher";
import { TokenService } from "../../infrastructure/security/TokenService";
import { SignUpUseCase } from "../../application/use-cases/SignUpUseCase";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "../../application/use-cases/GetCurrentUserUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshTokenUseCase";
import { env } from "../../../../config/env";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

const router = Router();

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: "Too many authentication attempts, please try again later.",
  handler: (req, res) => {
    Logger.security("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message:
          "Too many authentication attempts. Please try again in 15 minutes.",
        requestId: req.id,
      },
    });
  },
});

// Dependency injection setup
const userRepo = new UserRepository();
const workspaceRepo = new WorkspaceRepository();
const passwordHasher = new PasswordHasher();
const tokenService = new TokenService();

const signUpUseCase = new SignUpUseCase(
  userRepo,
  workspaceRepo,
  passwordHasher,
  tokenService
);
const loginUseCase = new LoginUseCase(userRepo, passwordHasher, tokenService);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, userRepo);

const authController = new AuthController(
  signUpUseCase,
  loginUseCase,
  getCurrentUserUseCase,
  refreshTokenUseCase
);

// Routes with rate limiting and validation
router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  asyncHandler(authController.signup)
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.get("/me", authenticate, asyncHandler(authController.getCurrentUser));

router.post(
  "/refresh",
  authLimiter,
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);

router.post("/logout", authenticate, asyncHandler(authController.logout));

export { router as authRoutes };
