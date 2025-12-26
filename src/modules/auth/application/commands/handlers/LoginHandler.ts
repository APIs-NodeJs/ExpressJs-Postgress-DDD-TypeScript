import { CommandHandler } from "../../../../../core/application/Command";
import { Result } from "../../../../../core/domain/Result";
import { LoginCommand } from "../LoginCommand";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { Email } from "../../../domain/value-objects/Email.vo";
import { BcryptHasher } from "../../../infrastructure/security/BcryptHasher";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";
import { EventPublisher } from "../../../../../core/infrastructure/messaging/EventPublisher";
import { UserStatus } from "../../../domain/aggregates/User.aggregate";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export class LoginHandler
  implements CommandHandler<LoginCommand, LoginResponse>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hasher: BcryptHasher,
    private readonly tokenService: JwtTokenService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(command: LoginCommand): Promise<Result<LoginResponse>> {
    // Validate email
    const emailOrError = Email.create(command.email);
    if (emailOrError.isFailure) {
      return Result.fail<LoginResponse>("Invalid credentials");
    }
    const email = emailOrError.getValue();

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Result.fail<LoginResponse>("Invalid credentials");
    }

    // Check user status
    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.PENDING
    ) {
      return Result.fail<LoginResponse>("Account is not active");
    }

    // Verify password
    const isPasswordValid = await this.hasher.compare(
      command.password,
      user.password.value
    );

    if (!isPasswordValid) {
      return Result.fail<LoginResponse>("Invalid credentials");
    }

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email.value,
      workspaceId: user.workspaceId,
    });

    const refreshToken = this.tokenService.generateRefreshToken({
      userId: user.id,
    });

    // Record login event
    user.recordLogin(command.ipAddress);

    // Publish events
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearEvents();

    return Result.ok({
      accessToken,
      refreshToken,
      userId: user.id,
      email: user.email.value,
    });
  }
}
