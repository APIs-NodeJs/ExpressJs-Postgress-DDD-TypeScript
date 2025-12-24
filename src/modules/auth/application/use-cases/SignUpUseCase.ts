import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { User } from "../../domain/entities/User";
import { Workspace } from "../../domain/entities/Workspace";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { WorkspaceRepository } from "../../infrastructure/repositories/WorkspaceRepository";
import { PasswordHasher } from "../../infrastructure/security/PasswordHasher";
import { TokenService } from "../../infrastructure/security/TokenService";
import { APP_CONSTANTS } from "../../../../config/constants";
import { withTransaction } from "../../../../config/database";
import { Logger } from "../../../../shared/infrastructure/logger/logger";

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

export class SignUpUseCase implements UseCase<SignUpRequest, SignUpResponse> {
  constructor(
    private userRepo: UserRepository,
    private workspaceRepo: WorkspaceRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
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

      // Use transaction to ensure atomicity
      const result = await withTransaction(async (transaction) => {
        // Hash password
        const hashedPassword = await this.passwordHasher.hash(req.password);

        // Create workspace first
        const workspace = Workspace.create({
          name: req.workspaceName.trim(),
          ownerId: "temp", // Will be updated
        });
        const createdWorkspace = await this.workspaceRepo.create(
          workspace,
          transaction
        );

        // Create user with workspace reference
        const user = User.create({
          email: req.email.toLowerCase().trim(),
          password: hashedPassword,
          name: req.name.trim(),
          role: APP_CONSTANTS.ROLES.OWNER,
          workspaceId: createdWorkspace.id,
        });
        const createdUser = await this.userRepo.create(user, transaction);

        // Update workspace owner
        await this.workspaceRepo.updateOwner(
          createdWorkspace.id,
          createdUser.id,
          transaction
        );

        return { user: createdUser, workspace: createdWorkspace };
      });

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        userId: result.user.id,
        workspaceId: result.user.workspaceId,
        email: result.user.email,
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

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one number",
      };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one special character",
      };
    }

    return { isValid: true };
  }
}
