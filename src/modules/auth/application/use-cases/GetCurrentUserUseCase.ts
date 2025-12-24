import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export class GetCurrentUserUseCase implements UseCase<{ userId: string }, any> {
  constructor(private userRepo: UserRepository) {}

  async execute(req: { userId: string }): Promise<Result<any>> {
    const user = await this.userRepo.findById(req.userId);
    if (!user) return Result.fail('User not found');
    return Result.ok(user.toDTO());
  }
}
