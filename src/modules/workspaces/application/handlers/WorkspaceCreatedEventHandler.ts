// src/modules/workspaces/application/handlers/WorkspaceCreatedEventHandler.ts
import { IEventHandler } from '../../../../core/application/EventBus';
import { WorkspaceCreatedEvent } from '../../domain/events/WorkspaceCreatedEvent';
import { Logger } from '../../../../core/utils/Logger';
import {
  NotificationSocketGateway,
  NotificationType,
} from '../../../../shared/infrastructure/socket/NotificationSocketGateway';
export class WorkspaceCreatedEventHandler implements IEventHandler<WorkspaceCreatedEvent> {
  private readonly logger: Logger;

  constructor(private notificationSocketGateway: NotificationSocketGateway) {
    this.logger = new Logger('WorkspaceCreatedEventHandler');
  }

  async handle(event: WorkspaceCreatedEvent): Promise<void> {
    try {
      const { name, ownerId } = event.data;
      const workspaceId = event.aggregateId;

      // Send notification to the owner
      this.notificationSocketGateway.sendNotification(ownerId, {
        id: `workspace-created-${workspaceId}`,
        type: NotificationType.SUCCESS,
        title: 'Workspace Created',
        message: `Your workspace "${name}" has been created successfully`,
        data: {
          workspaceId,
          workspaceName: name,
        },
        actionUrl: `/workspaces/${workspaceId}`,
        read: false,
        createdAt: new Date(),
      });

      this.logger.info('Workspace created event handled successfully', {
        workspaceId,
        name,
      });
    } catch (error) {
      this.logger.error('Error handling workspace created event', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.eventId,
      });
    }
  }
}
