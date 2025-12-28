// src/modules/workspaces/application/useCases/AddMemberToWorkspaceUseCase.ts
import { IUseCase } from '../../../../core/application/UseCase';
import { Result } from '../../../../core/domain/Result';
import { WorkspaceMember } from '../../domain/entities/WorkspaceMember';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { WorkspaceRole } from '../../domain/valueObjects/WorkspaceRole';
import { getDefaultPermissionsByRole } from '../../domain/valueObjects/Permission';

interface AddMemberRequest {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

interface AddMemberResponse {
  member: {
    id: string;
    userId: string;
    role: string;
    permissions: string[];
  };
}

export class AddMemberToWorkspaceUseCase implements IUseCase<
  AddMemberRequest,
  AddMemberResponse
> {
  constructor(
    private workspaceRepository: IWorkspaceRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: AddMemberRequest): Promise<Result<AddMemberResponse>> {
    const workspace = await this.workspaceRepository.findById(request.workspaceId);
    if (!workspace) {
      return Result.fail<AddMemberResponse>('Workspace not found');
    }

    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      return Result.fail<AddMemberResponse>('User not found');
    }

    const permissions = getDefaultPermissionsByRole(request.role);

    const memberResult = WorkspaceMember.create({
      workspaceId: request.workspaceId,
      userId: request.userId,
      role: request.role,
      permissions,
    });

    if (memberResult.isFailure) {
      return Result.fail<AddMemberResponse>(memberResult.getErrorValue());
    }

    const member = memberResult.getValue();
    const addResult = workspace.addMember(member);

    if (addResult.isFailure) {
      return Result.fail<AddMemberResponse>(addResult.getErrorValue());
    }

    await this.workspaceRepository.save(workspace);

    return Result.ok<AddMemberResponse>({
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions as string[],
      },
    });
  }
}
