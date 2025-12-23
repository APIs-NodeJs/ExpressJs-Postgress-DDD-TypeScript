import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { PasswordHasher } from '../../infrastructure/security/PasswordHasher';
import { TokenService, TokenPair } from '../../infrastructure/security/TokenService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: TokenPair;
}

export class LoginUseCase implements UseCase<LoginRequest, LoginResponse> {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async execute(request: LoginRequest): Promise<Result<LoginResponse>> {
    // Find user
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      return Result.fail('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      request.password,
      user.password
    );

    if (!isPasswordValid) {
      return Result.fail('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
    });

    return Result.ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    });
  }
}
