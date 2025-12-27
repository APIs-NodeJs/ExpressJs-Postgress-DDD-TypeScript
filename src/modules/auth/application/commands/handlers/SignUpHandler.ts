import { CommandHandler } from "../../../../../core/application/Command";
import { Result } from "../../../../../core/domain/Result";
import { SignUpCommand } from "../SignUpCommand";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IWorkspaceRepository } from "../../../domain/repositories/IWorkspaceRepository";
import { Email } from "../../../domain/value-objects/Email.vo";
import { Password } from "../../../domain/value-objects/Password.vo";
import { User } from "../../../domain/aggregates/User.aggregate";
import { Workspace } from "../../../domain/aggregates/Workspace.aggregate";
import { UnitOfWork } from "../../../../../core/infrastructure/persistence/UnitOfWork";
import { EventPublisher } from "../../../../../core/infrastructure/messaging/EventPublisher";
import { BcryptHasher } from "../../../infrastructure/security/BcryptHasher";
import { PasswordPolicyService } from "../../../domain/services/PasswordPolicy.service";
import { logger } from "../../../../../shared/utils/logger";
import {
  AppError,
  ConflictError,
  ValidationError,
} from "../../../../../shared/errors/AppError";

interface SignUpResponse {
  userId: string;
  workspaceId: string;
  email: string;
}

export class SignUpHandler implements CommandHandler<
  SignUpCommand,
  SignUpResponse
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: EventPublisher,
    private readonly hasher: BcryptHasher
  ) {}

  async execute(command: SignUpCommand): Promise<Result<SignUpResponse>> {
    const startTime = Date.now();

    try {
      // ==========================================
      // STEP 1: VALIDATE INPUT
      // ==========================================
      const emailOrError = Email.create(command.email);
      if (emailOrError.isFailure) {
        throw new ValidationError(emailOrError.error!);
      }
      const email = emailOrError.getValue();

      // Check if user already exists
      const emailExists = await this.userRepository.existsByEmail(email);
      if (emailExists) {
        throw new ConflictError("User with this email already exists");
      }

      // Validate password policy
      const policyCheck = PasswordPolicyService.validate(command.password);
      if (policyCheck.isFailure) {
        throw new ValidationError(policyCheck.error!);
      }

      // ==========================================
      // STEP 2: CREATE PASSWORD VALUE OBJECT
      // ==========================================
      const passwordOrError = Password.create(command.password);
      if (passwordOrError.isFailure) {
        throw new ValidationError(passwordOrError.error!);
      }

      // Hash password
      const hashedPassword = await this.hasher.hash(
        passwordOrError.getValue().value
      );
      const hashedPasswordVO = Password.createHashed(hashedPassword).getValue();

      // ==========================================
      // STEP 3: CREATE USER AGGREGATE (No workspace yet)
      // ==========================================
      const userOrError = User.create(
        email,
        hashedPasswordVO,
        undefined, // No ID yet - will be generated
        command.firstName,
        command.lastName
      );

      if (userOrError.isFailure) {
        throw new ValidationError(userOrError.error!);
      }

      const user = userOrError.getValue();

      // ==========================================
      // STEP 4: CREATE WORKSPACE AGGREGATE
      // ==========================================
      const workspaceName = command.firstName
        ? `${command.firstName}'s Workspace`
        : `${email.value.split("@")[0]}'s Workspace`;

      const workspaceOrError = Workspace.createWithOwner(
        workspaceName,
        user.id, // User ID is now available
        email
      );

      if (workspaceOrError.isFailure) {
        throw new ValidationError(workspaceOrError.error!);
      }

      const workspace = workspaceOrError.getValue();

      // ==========================================
      // STEP 5: ASSIGN USER TO WORKSPACE
      // ==========================================
      const assignResult = user.assignToWorkspace(workspace.id);
      if (assignResult.isFailure) {
        throw new ValidationError(assignResult.error!);
      }

      // ==========================================
      // STEP 6: PERSIST IN TRANSACTION
      // ==========================================
      await this.unitOfWork.start();

      try {
        // Save in correct order:
        // 1. User first (so userId exists)
        await this.userRepository.save(user);

        // 2. Workspace second (references userId)
        await this.workspaceRepository.save(workspace);

        // Commit transaction
        await this.unitOfWork.commit();

        logger.info("User and workspace created successfully", {
          userId: user.id,
          workspaceId: workspace.id,
          email: email.value,
        });
      } catch (error) {
        await this.unitOfWork.rollback();
        throw error;
      }

      // ==========================================
      // STEP 7: PUBLISH DOMAIN EVENTS
      // ==========================================
      // Events are published AFTER successful persistence
      const allEvents = [...user.domainEvents, ...workspace.domainEvents];

      await this.eventPublisher.publishAll(allEvents);

      user.clearEvents();
      workspace.clearEvents();

      const duration = Date.now() - startTime;

      logger.info("User signup completed", {
        userId: user.id,
        email: user.email.value,
        workspaceId: workspace.id,
        duration: `${duration}ms`,
      });

      // ==========================================
      // STEP 8: RETURN RESPONSE
      // ==========================================
      return Result.ok({
        userId: user.id,
        workspaceId: workspace.id,
        email: user.email.value,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("SignUp failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: command.email,
        duration: `${duration}ms`,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error("Failed to create user account");
    }
  }
}
