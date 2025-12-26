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

interface SignUpResponse {
  userId: string;
  workspaceId: string;
  email: string;
}

export class SignUpHandler
  implements CommandHandler<SignUpCommand, SignUpResponse>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: EventPublisher,
    private readonly hasher: BcryptHasher
  ) {}

  async execute(command: SignUpCommand): Promise<Result<SignUpResponse>> {
    // Validate email
    const emailOrError = Email.create(command.email);
    if (emailOrError.isFailure) {
      return Result.fail<SignUpResponse>(emailOrError.error!);
    }
    const email = emailOrError.getValue();

    // Check if user already exists
    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      return Result.fail<SignUpResponse>("User with this email already exists");
    }

    // Validate password policy
    const policyCheck = PasswordPolicyService.validate(command.password);
    if (policyCheck.isFailure) {
      return Result.fail<SignUpResponse>(policyCheck.error!);
    }

    // Create password value object
    const passwordOrError = Password.create(command.password);
    if (passwordOrError.isFailure) {
      return Result.fail<SignUpResponse>(passwordOrError.error!);
    }

    // Hash password
    const hashedPassword = await this.hasher.hash(
      passwordOrError.getValue().value
    );
    const hashedPasswordVO = Password.createHashed(hashedPassword).getValue();

    try {
      // Start transaction
      await this.unitOfWork.start();

      // Create workspace
      const workspaceName = `${
        command.firstName || email.value.split("@")[0]
      }'s Workspace`;
      const workspaceOrError = Workspace.create(workspaceName, "");
      if (workspaceOrError.isFailure) {
        await this.unitOfWork.rollback();
        return Result.fail<SignUpResponse>(workspaceOrError.error!);
      }
      const workspace = workspaceOrError.getValue();

      await this.workspaceRepository.save(workspace);

      // Create user
      const userOrError = User.create(email, hashedPasswordVO, workspace.id);
      if (userOrError.isFailure) {
        await this.unitOfWork.rollback();
        return Result.fail<SignUpResponse>(userOrError.error!);
      }
      const user = userOrError.getValue();

      await this.userRepository.save(user);

      // Commit transaction
      await this.unitOfWork.commit();

      // Publish domain events
      await this.eventPublisher.publishAll([
        ...workspace.domainEvents,
        ...user.domainEvents,
      ]);

      workspace.clearEvents();
      user.clearEvents();

      return Result.ok({
        userId: user.id,
        workspaceId: workspace.id,
        email: user.email.value,
      });
    } catch (error) {
      await this.unitOfWork.rollback();
      return Result.fail<SignUpResponse>("Failed to create user");
    }
  }
}
