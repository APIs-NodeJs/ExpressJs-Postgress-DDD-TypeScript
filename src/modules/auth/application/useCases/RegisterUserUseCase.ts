// src/modules/auth/application/useCases/RegisterUserUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { User } from '../../../users/domain/entities/User';
import { Email } from '../../../users/domain/valueObjects/Email';
import { UserRole } from '../../../users/domain/valueObjects/UserRole';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { TokenService, TokenPayload } from '../../domain/services/TokenService';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface RegisterUserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class RegisterUserUseCase implements IUseCase<
  RegisterUserRequest,
  RegisterUserResponse
> {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(request: RegisterUserRequest): Promise<Result<RegisterUserResponse>> {
    const emailResult = Email.create(request.email);
    if (emailResult.isFailure) {
      return Result.fail<RegisterUserResponse>(emailResult.getErrorValue());
    }

    const existingUser = await this.userRepository.findByEmail(emailResult.getValue());
    if (existingUser) {
      return Result.fail<RegisterUserResponse>('Email already registered');
    }

    const passwordValidation = PasswordService.validate(request.password);
    if (passwordValidation.isFailure) {
      return Result.fail<RegisterUserResponse>(passwordValidation.getErrorValue());
    }

    const passwordHashResult = await PasswordService.hash(request.password);
    if (passwordHashResult.isFailure) {
      return Result.fail<RegisterUserResponse>(passwordHashResult.getErrorValue());
    }

    const userResult = User.create({
      email: emailResult.getValue(),
      firstName: request.firstName,
      lastName: request.lastName,
      passwordHash: passwordHashResult.getValue(),
      role: UserRole.USER,
      emailVerified: false,
    });

    if (userResult.isFailure) {
      return Result.fail<RegisterUserResponse>(userResult.getErrorValue());
    }

    const user = userResult.getValue();
    await this.userRepository.save(user);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email.value,
      role: user.role,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshTokenValue = TokenService.generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenResult = RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    });

    if (refreshTokenResult.isSuccess) {
      await this.refreshTokenRepository.save(refreshTokenResult.getValue());
    }

    return Result.ok<RegisterUserResponse>({
      user: {
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    });
  }
}
