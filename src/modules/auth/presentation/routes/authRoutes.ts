import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../../../../infrastructure/http/middlewares/validate';
import { authenticate } from '../../../../infrastructure/http/middlewares/authenticate';
import { signupSchema, loginSchema, refreshTokenSchema } from '../../infrastructure/validators/authValidators';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../infrastructure/repositories/WorkspaceRepository';
import { PasswordHasher } from '../../infrastructure/security/PasswordHasher';
import { TokenService } from '../../infrastructure/security/TokenService';
import { SignUpUseCase } from '../../application/use-cases/SignUpUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';

const router = Router();

const userRepo = new UserRepository();
const workspaceRepo = new WorkspaceRepository();
const passwordHasher = new PasswordHasher();
const tokenService = new TokenService();

const signUpUseCase = new SignUpUseCase(userRepo, workspaceRepo, passwordHasher, tokenService);
const loginUseCase = new LoginUseCase(userRepo, passwordHasher, tokenService);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, userRepo);

const authController = new AuthController(
  signUpUseCase,
  loginUseCase,
  getCurrentUserUseCase,
  refreshTokenUseCase
);

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

export { router as authRoutes };
