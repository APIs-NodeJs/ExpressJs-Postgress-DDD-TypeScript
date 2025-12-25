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
import { env } from "../../../../config/env";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { container } from "../../../../infrastructure/di/container";
import { TOKENS } from "../../../../infrastructure/di/tokens";
import { SignUpUseCase } from "../../application/use-cases/SignUpUseCase";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "../../application/use-cases/GetCurrentUserUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshTokenUseCase";

const router = Router();

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.security("Auth rate limit exceeded", { ip: req.ip, path: req.path });
    res.status(429).json({
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts.",
        requestId: req.id,
      },
    });
  },
});

// ✅ FIX: Lazy initialization - resolve dependencies when routes are actually used
// This ensures the container is set up before we try to resolve
const getAuthController = () => {
  const signUpUseCase = container.resolve<SignUpUseCase>(TOKENS.SignUpUseCase);
  const loginUseCase = container.resolve<LoginUseCase>(TOKENS.LoginUseCase);
  const getCurrentUserUseCase = container.resolve<GetCurrentUserUseCase>(
    TOKENS.GetCurrentUserUseCase
  );
  const refreshTokenUseCase = container.resolve<RefreshTokenUseCase>(
    TOKENS.RefreshTokenUseCase
  );

  return new AuthController(
    signUpUseCase,
    loginUseCase,
    getCurrentUserUseCase,
    refreshTokenUseCase
  );
};

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Create new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - workspaceName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Test123!@#
 *                 description: Must contain uppercase, lowercase, number, and special character
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               workspaceName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: My Workspace
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Too many requests
 */
router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  asyncHandler((req, res, next) => getAuthController().signup(req, res, next))
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler((req, res, next) => getAuthController().login(req, res, next))
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get(
  "/me",
  authenticate,
  asyncHandler((req, res, next) =>
    getAuthController().getCurrentUser(req, res, next)
  )
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  "/refresh",
  authLimiter,
  validate(refreshTokenSchema),
  asyncHandler((req, res, next) =>
    getAuthController().refreshToken(req, res, next)
  )
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/logout",
  authenticate,
  asyncHandler((req, res, next) => getAuthController().logout(req, res, next))
);

export { router as authRoutes };
