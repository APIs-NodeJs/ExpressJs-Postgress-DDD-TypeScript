import { UseCase } from '../../../../shared/application/UseCase';
import { Result } from '../../../../shared/application/Result';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface GetCurrentUserRequest {
  userId: string;
}

export interface GetCurrentUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  workspaceId: string;
  avatar?: string;
}

export class GetCurrentUserUseCase implements UseCase<GetCurrentUserRequest, GetCurrentUserResponse> {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetCurrentUserRequest): Promise<Result<GetCurrentUserResponse>> {
    const user = await this.userRepository.findById(request.userId);
    
    if (!user) {
      return Result.fail('User not found');
    }

    return Result.ok({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      workspaceId: user.workspaceId,
      avatar: user.avatar,
    });
  }
}
