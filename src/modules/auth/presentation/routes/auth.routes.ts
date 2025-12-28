// src/modules/auth/presentation/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../../../../shared/middlewares/validateRequest';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  GoogleAuthRequestSchema,
  RefreshTokenRequestSchema,
} from '../dto/AuthDTO';
import { sequelize } from '../../../../shared/config/database.config';
import { SequelizeUnitOfWork } from '../../../../core/infrastructure/persistence/SequelizeUnitOfWork';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/UserRepository';
import { RefreshTokenRepository } from '../../infrastructure/persistence/repositories/RefreshTokenRepository';
import { RegisterUserUseCase } from '../../application/useCases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/useCases/LoginUserUseCase';
import { GoogleAuthUseCase } from '../../application/useCases/GoogleAuthUseCase';
import { RefreshTokenUseCase } from '../../application/useCases/RefreshTokenUseCase';

const router = Router();

const unitOfWork = new SequelizeUnitOfWork(sequelize);
const userRepository = new UserRepository(unitOfWork);
const refreshTokenRepository = new RefreshTokenRepository(unitOfWork);

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  refreshTokenRepository
);
const loginUserUseCase = new LoginUserUseCase(userRepository, refreshTokenRepository);
const googleAuthUseCase = new GoogleAuthUseCase(userRepository, refreshTokenRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepository,
  refreshTokenRepository
);

const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  googleAuthUseCase,
  refreshTokenUseCase
);

router.post('/register', validateRequest({ body: RegisterRequestSchema }), (req, res) =>
  authController.register(req, res)
);

router.post('/login', validateRequest({ body: LoginRequestSchema }), (req, res) =>
  authController.login(req, res)
);

router.get('/google', (req, res) => authController.googleAuthUrl(req, res));

router.post(
  '/google/callback',
  validateRequest({ body: GoogleAuthRequestSchema }),
  (req, res) => authController.googleAuthCallback(req, res)
);

router.post(
  '/refresh',
  validateRequest({ body: RefreshTokenRequestSchema }),
  (req, res) => authController.refreshToken(req, res)
);

router.post('/logout', (req, res) => authController.logout(req, res));

export { router as authRouter };
