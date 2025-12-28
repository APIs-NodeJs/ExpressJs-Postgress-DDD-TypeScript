// src/modules/workspaces/domain/events/MemberAddedToWorkspaceEvent.ts
import { BaseDomainEvent } from '../../../../core/domain/DomainEvent';
import { WorkspaceRole } from '../valueObjects/WorkspaceRole';

export class MemberAddedToWorkspaceEvent extends BaseDomainEvent {
  constructor(
    workspaceId: string,
    public readonly data: {
      userId: string;
      role: WorkspaceRole;
    }
  ) {
    super(workspaceId, 'MemberAddedToWorkspace', 1);
  }
}
