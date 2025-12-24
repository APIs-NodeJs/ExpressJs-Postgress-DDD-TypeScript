import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { User } from '../../domain/entities/User';
import { Workspace } from '../../domain/entities/Workspace';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../infrastructure/repositories/WorkspaceRepository';
import { PasswordHasher } from '../../infrastructure/security/PasswordHasher';
import { TokenService } from '../../infrastructure/security/TokenService';
import { APP_CONSTANTS } from '../../../../config/constants';

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

export class SignUpUseCase implements UseCase<SignUpRequest, any> {
  constructor(
    private userRepo: UserRepository,
    private workspaceRepo: WorkspaceRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async execute(req: SignUpRequest): Promise<Result<any>> {
    const existing = await this.userRepo.findByEmail(req.email);
    if (existing) return Result.fail('Email already exists');

    const hashedPassword = await this.passwordHasher.hash(req.password);
    const tempUser = User.create({
      email: req.email,
      password: hashedPassword,
      name: req.name,
      role: APP_CONSTANTS.ROLES.OWNER,
      workspaceId: 'temp',
    });

    const workspace = Workspace.create({
      name: req.workspaceName,
      ownerId: tempUser.id,
    });
    await this.workspaceRepo.create(workspace);

    const user = User.create({
      id: tempUser.id,
      email: req.email,
      password: hashedPassword,
      name: req.name,
      role: APP_CONSTANTS.ROLES.OWNER,
      workspaceId: workspace.id,
    });
    await this.userRepo.create(user);

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
    });

    return Result.ok({ user: user.toDTO(), tokens });
  }
}
