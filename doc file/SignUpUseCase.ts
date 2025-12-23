import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { User } from '../../domain/entities/User';
import { Workspace } from '../../domain/entities/Workspace';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../infrastructure/repositories/WorkspaceRepository';
import { PasswordHasher } from '../../infrastructure/security/PasswordHasher';
import { TokenService, TokenPair } from '../../infrastructure/security/TokenService';
import { APP_CONSTANTS } from '../../../../config/constants';

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

export interface SignUpResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    workspaceId: string;
  };
  tokens: TokenPair;
}

export class SignUpUseCase implements UseCase<SignUpRequest, SignUpResponse> {
  constructor(
    private userRepository: UserRepository,
    private workspaceRepository: WorkspaceRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async execute(request: SignUpRequest): Promise<Result<SignUpResponse>> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      return Result.fail('Email already exists');
    }

    // Validate password
    const passwordValidation = this.passwordHasher.validate(request.password);
    if (!passwordValidation.valid) {
      return Result.fail(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(request.password);

    // Create user (temporary ID for workspace creation)
    const tempUser = User.create({
      email: request.email,
      password: hashedPassword,
      name: request.name,
      role: APP_CONSTANTS.ROLES.OWNER,
      emailVerified: false,
      workspaceId: 'temp', // Will be updated after workspace creation
    });

    // Create workspace
    const workspace = Workspace.create({
      name: request.workspaceName,
      ownerId: tempUser.id,
    });

    await this.workspaceRepository.create(workspace);

    // Create user with correct workspace ID
    const user = User.create({
      id: tempUser.id,
      email: request.email,
      password: hashedPassword,
      name: request.name,
      role: APP_CONSTANTS.ROLES.OWNER,
      emailVerified: false,
      workspaceId: workspace.id,
    });

    await this.userRepository.create(user);

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
        emailVerified: user.emailVerified,
        workspaceId: user.workspaceId,
      },
      tokens,
    });
  }
}
