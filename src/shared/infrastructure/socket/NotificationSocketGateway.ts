import { BaseSocketGateway } from './BaseSocketGateway';
import { AuthenticatedSocket } from './SocketServer';

// src/modules/notifications/infrastructure/socket/NotificationSocketGateway.ts
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

export class NotificationSocketGateway extends BaseSocketGateway {
  constructor() {
    super('NotificationGateway');
  }

  public handleConnection(socket: AuthenticatedSocket): void {
    this.setupNotificationEvents(socket);
  }

  private setupNotificationEvents(socket: AuthenticatedSocket): void {
    // Mark notification as read
    socket.on('notification:mark_read', (data: { notificationId: string }, callback) => {
      this.logger.debug('Notification marked as read', {
        userId: socket.userId,
        notificationId: data.notificationId,
      });

      // In a real implementation, you would update the database here
      callback?.({ success: true });
    });

    // Mark all notifications as read
    socket.on('notification:mark_all_read', callback => {
      this.logger.debug('All notifications marked as read', {
        userId: socket.userId,
      });

      // In a real implementation, you would update the database here
      callback?.({ success: true });
    });

    // Request notification count
    socket.on('notification:get_count', callback => {
      // In a real implementation, you would query the database here
      const unreadCount = 0;

      callback?.({ success: true, count: unreadCount });
    });
  }

  // Method to be called from event handlers
  public sendNotification(userId: string, notification: NotificationPayload): void {
    this.emitToUser(userId, 'notification:new', notification);

    this.logger.info('Notification sent', {
      userId,
      notificationId: notification.id,
      type: notification.type,
    });
  }

  public sendBulkNotifications(
    userIds: string[],
    notification: Omit<NotificationPayload, 'id'>
  ): void {
    userIds.forEach(userId => {
      const userNotification: NotificationPayload = {
        ...notification,
        id: `${Date.now()}-${userId}`,
      };
      this.sendNotification(userId, userNotification);
    });
  }

  public sendWorkspaceNotification(
    workspaceId: string,
    notification: NotificationPayload
  ): void {
    this.emitToWorkspace(workspaceId, 'notification:new', notification);

    this.logger.info('Workspace notification sent', {
      workspaceId,
      notificationId: notification.id,
      type: notification.type,
    });
  }
}
