import { injectable, inject } from "tsyringe";
import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { User } from "../../domain/entities/User";
import { Workspace } from "../../domain/entities/Workspace";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IWorkspaceRepository } from "../../domain/repositories/IWorkspaceRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { ITokenService } from "../../domain/services/ITokenService";
import { APP_CONSTANTS } from "../../../../config/constants";
import { withTransaction } from "../../../../config/database";
import { Logger } from "../../../../shared/infrastructure/logger/logger";
import { TOKENS } from "../../../../infrastructure/di/tokens";

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
    role: string;
    workspaceId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

@injectable()
export class SignUpUseCase implements UseCase<SignUpRequest, SignUpResponse> {
  constructor(
    @inject(TOKENS.IUserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.IWorkspaceRepository)
    private workspaceRepo: IWorkspaceRepository,
    @inject(TOKENS.IPasswordHasher) private passwordHasher: IPasswordHasher,
    @inject(TOKENS.ITokenService) private tokenService: ITokenService
  ) {}

  async execute(req: SignUpRequest): Promise<Result<SignUpResponse>> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePassword(req.password);
      if (!passwordValidation.isValid) {
        return Result.fail(passwordValidation.error!);
      }

      // Check if email already exists
      const existing = await this.userRepo.findByEmail(req.email);
      if (existing) {
        Logger.security("Signup attempt with existing email", {
          email: req.email,
        });
        return Result.fail("Email already exists");
      }

      // Use transaction
      const result = await withTransaction(async (transaction) => {
        const hashedPassword = await this.passwordHasher.hash(req.password);

        const workspace = Workspace.create({
          name: req.workspaceName.trim(),
          ownerId: "temp",
        });
        const createdWorkspace = await this.workspaceRepo.create(
          workspace,
          transaction
        );

        const user = User.create({
          email: req.email.toLowerCase().trim(),
          password: hashedPassword,
          name: req.name.trim(),
          role: APP_CONSTANTS.ROLES.OWNER,
          workspaceId: createdWorkspace.id,
        });
        const createdUser = await this.userRepo.create(user, transaction);

        await this.workspaceRepo.updateOwner(
          createdWorkspace.id,
          createdUser.id,
          transaction
        );

        return { user: createdUser, workspace: createdWorkspace };
      });

      const tokens = this.tokenService.generateTokenPair({
        userId: result.user.id,
        workspaceId: result.user.workspaceId,
        email: result.user.email,
        role: result.user.role,
      });

      Logger.info("User signed up successfully", {
        userId: result.user.id,
        email: result.user.email,
        workspaceId: result.workspace.id,
      });

      return Result.ok({
        user: result.user.toDTO(),
        tokens,
      });
    } catch (error) {
      Logger.error("Signup failed", error, { email: req.email });
      return Result.fail("Failed to create account. Please try again.");
    }
  }

  private validatePassword(password: string): {
    isValid: boolean;
    error?: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        error: "Password must be at least 8 characters",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain lowercase letter",
      };
    }
    if (!/\d/.test(password)) {
      return { isValid: false, error: "Password must contain number" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain special character",
      };
    }
    return { isValid: true };
  }
}
