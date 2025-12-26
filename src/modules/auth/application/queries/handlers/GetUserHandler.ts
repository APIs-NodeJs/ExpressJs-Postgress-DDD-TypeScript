import { QueryHandler } from "../../../../../core/application/Query";
import { Result } from "../../../../../core/domain/Result";
import { GetUserQuery } from "../GetUserQuery";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";

interface UserResponse {
  id: string;
  email: string;
  workspaceId: string;
  status: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export class GetUserHandler
  implements QueryHandler<GetUserQuery, UserResponse>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserQuery): Promise<Result<UserResponse>> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      return Result.fail<UserResponse>("User not found");
    }

    return Result.ok({
      id: user.id,
      email: user.email.value,
      workspaceId: user.workspaceId,
      status: user.status,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    });
  }
}
