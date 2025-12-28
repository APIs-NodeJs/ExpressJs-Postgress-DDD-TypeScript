// src/modules/workspaces/domain/events/WorkspaceCreatedEvent.ts
import { BaseDomainEvent } from '../../../../core/domain/DomainEvent';

export class WorkspaceCreatedEvent extends BaseDomainEvent {
  constructor(
    workspaceId: string,
    public readonly data: {
      name: string;
      slug: string;
      ownerId: string;
    }
  ) {
    super(workspaceId, 'WorkspaceCreated', 1);
  }
}
