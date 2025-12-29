// src/modules/workspaces/application/handlers/MemberAddedEventHandler.ts
import { IEventHandler } from '../../../../core/application/EventBus';
import { MemberAddedToWorkspaceEvent } from '../../domain/events/MemberAddedToWorkspaceEvent';
import { IUserRepository } from '../../../users/domain/repositories/IUserRepository';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { Logger } from '../../../../core/utils/Logger';
import { WorkspaceSocketGateway } from '../../../../shared/infrastructure/socket/WorkspaceSocketGateway';
import {
  NotificationSocketGateway,
  NotificationType,
} from '../../../../shared/infrastructure/socket/NotificationSocketGateway';

export class MemberAddedEventHandler implements IEventHandler<MemberAddedToWorkspaceEvent> {
  private readonly logger: Logger;

  constructor(
    private workspaceSocketGateway: WorkspaceSocketGateway,
    private notificationSocketGateway: NotificationSocketGateway,
    private userRepository: IUserRepository,
    private workspaceRepository: IWorkspaceRepository
  ) {
    this.logger = new Logger('MemberAddedEventHandler');
  }

  async handle(event: MemberAddedToWorkspaceEvent): Promise<void> {
    try {
      const { userId, role } = event.data;
      const workspaceId = event.aggregateId;

      // Fetch user and workspace details
      const [user, workspace] = await Promise.all([
        this.userRepository.findById(userId),
        this.workspaceRepository.findById(workspaceId),
      ]);

      if (!user || !workspace) {
        this.logger.warn('User or workspace not found', { userId, workspaceId });
        return;
      }

      // Notify workspace members via Socket.IO
      this.workspaceSocketGateway.notifyMemberAdded(workspaceId, {
        memberId: userId,
        userId: user.id,
        email: user.email.value,
        role,
      });

      // Send notification to the new member
      this.notificationSocketGateway.sendNotification(userId, {
        id: `member-added-${workspaceId}-${userId}`,
        type: NotificationType.SUCCESS,
        title: 'Added to Workspace',
        message: `You have been added to workspace "${workspace.name}" as ${role}`,
        data: {
          workspaceId,
          workspaceName: workspace.name,
          role,
        },
        actionUrl: `/workspaces/${workspaceId}`,
        read: false,
        createdAt: new Date(),
      });

      // Notify workspace owner
      if (workspace.ownerId !== userId) {
        const owner = await this.userRepository.findById(workspace.ownerId);
        if (owner) {
          this.notificationSocketGateway.sendNotification(workspace.ownerId, {
            id: `member-added-owner-${workspaceId}-${userId}`,
            type: NotificationType.INFO,
            title: 'New Member Added',
            message: `${user.fullName} (${user.email.value}) was added to "${workspace.name}"`,
            data: {
              workspaceId,
              workspaceName: workspace.name,
              newMemberEmail: user.email.value,
              role,
            },
            actionUrl: `/workspaces/${workspaceId}/members`,
            read: false,
            createdAt: new Date(),
          });
        }
      }

      this.logger.info('Member added event handled successfully', {
        workspaceId,
        userId,
        role,
      });
    } catch (error) {
      this.logger.error('Error handling member added event', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.eventId,
      });
    }
  }
}
