import { CommandHandler } from "../../../../../core/application/Command";
import { Result } from "../../../../../core/domain/Result";
import { SignUpCommand } from "../SignUpCommand";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IWorkspaceRepository } from "../../../domain/repositories/IWorkspaceRepository";
import { Email } from "../../../domain/value-objects/Email.vo";
import { Password } from "../../../domain/value-objects/Password.vo";
import { UserId } from "../../../domain/value-objects/UserId.vo";
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
      // Step 1: Validate email
      const emailOrError = Email.create(command.email);
      if (emailOrError.isFailure) {
        throw new ValidationError(emailOrError.error!);
      }
      const email = emailOrError.getValue();

      // Step 2: Check if user already exists
      const emailExists = await this.userRepository.existsByEmail(email);
      if (emailExists) {
        throw new ConflictError("User with this email already exists");
      }

      // Step 3: Validate password policy
      const policyCheck = PasswordPolicyService.validate(command.password);
      if (policyCheck.isFailure) {
        throw new ValidationError(policyCheck.error!);
      }

      // Step 4: Create password value object
      const passwordOrError = Password.create(command.password);
      if (passwordOrError.isFailure) {
        throw new ValidationError(passwordOrError.error!);
      }

      // Step 5: Hash password
      const hashedPassword = await this.hasher.hash(
        passwordOrError.getValue().value
      );
      const hashedPasswordVO = Password.createHashed(hashedPassword).getValue();

      // Step 6: Generate user ID first (FIXED)
      const userId = UserId.create().getValue().value;

      // Step 7: Start transaction
      await this.unitOfWork.start();

      try {
        // Step 8: Create workspace with proper owner ID (FIXED)
        const workspaceName = `${command.firstName || email.value.split("@")[0]}'s Workspace`;
        const workspaceOrError = Workspace.create(workspaceName, userId);

        if (workspaceOrError.isFailure) {
          throw new ValidationError(workspaceOrError.error!);
        }

        const workspace = workspaceOrError.getValue();
        await this.workspaceRepository.save(workspace);

        // Step 9: Create user with generated ID (FIXED)
        const userOrError = User.create(
          email,
          hashedPasswordVO,
          workspace.id,
          userId
        );

        if (userOrError.isFailure) {
          throw new ValidationError(userOrError.error!);
        }

        const user = userOrError.getValue();

        // Set optional fields if provided
        if (command.firstName || command.lastName) {
          Object.assign(user, {
            props: {
              ...user["props"],
              firstName: command.firstName,
              lastName: command.lastName,
            },
          });
        }

        await this.userRepository.save(user);

        // Step 10: Commit transaction
        await this.unitOfWork.commit();

        // Step 11: Publish domain events
        await this.eventPublisher.publishAll([
          ...workspace.domainEvents,
          ...user.domainEvents,
        ]);

        workspace.clearEvents();
        user.clearEvents();

        const duration = Date.now() - startTime;

        logger.info("User signed up successfully", {
          userId: user.id,
          email: user.email.value,
          workspaceId: workspace.id,
          duration: `${duration}ms`,
        });

        return Result.ok({
          userId: user.id,
          workspaceId: workspace.id,
          email: user.email.value,
        });
      } catch (error) {
        await this.unitOfWork.rollback();
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("SignUp failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: command.email,
        duration: `${duration}ms`,
      });

      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error("Failed to create user");
    }
  }
}
