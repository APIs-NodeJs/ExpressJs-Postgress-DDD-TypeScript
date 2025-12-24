import { UseCase } from "../../../../shared/application/UseCase";
import { Result } from "../../../../shared/application/Result";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { PasswordHasher } from "../../infrastructure/security/PasswordHasher";
import { TokenService } from "../../infrastructure/security/TokenService";

export interface LoginRequest {
  email: string;
  password: string;
}

export class LoginUseCase implements UseCase<LoginRequest, any> {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async execute(req: LoginRequest): Promise<Result<any>> {
    const user = await this.userRepo.findByEmail(req.email);
    if (!user) return Result.fail("Invalid credentials");

    const valid = await this.passwordHasher.compare(
      req.password,
      user.password
    );
    if (!valid) return Result.fail("Invalid credentials");

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      role: user.role, // ✅ ADDED
    });

    return Result.ok({ user: user.toDTO(), tokens });
  }
}
