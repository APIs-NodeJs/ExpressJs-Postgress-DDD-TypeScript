// src/modules/workspaces/application/services/WorkspaceNotificationService.ts
import { WorkspaceSocketGateway } from '../../../../shared/infrastructure/socket/WorkspaceSocketGateway';
import {
  NotificationSocketGateway,
  NotificationType,
} from '../../../../shared/infrastructure/socket/NotificationSocketGateway';
import { Logger } from '../../../../core/utils/Logger';

export interface MemberInfo {
  memberId: string;
  userId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  ownerId: string;
}

/**
 * Application service for workspace notifications
 * Handles all notification logic for workspace operations
 */
export interface IWorkspaceNotificationService {
  notifyMemberAdded(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    addedBy: string
  ): Promise<void>;

  notifyMemberRemoved(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    removedBy: string
  ): Promise<void>;

  notifyMemberRoleChanged(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    oldRole: string,
    newRole: string,
    changedBy: string
  ): Promise<void>;

  notifyWorkspaceUpdated(
    workspace: WorkspaceInfo,
    changes: Record<string, any>,
    updatedBy: string
  ): Promise<void>;

  notifyWorkspaceDeleted(workspace: WorkspaceInfo, deletedBy: string): Promise<void>;
}

export class WorkspaceNotificationService implements IWorkspaceNotificationService {
  private readonly logger: Logger;

  constructor(
    private workspaceGateway: WorkspaceSocketGateway,
    private notificationGateway: NotificationSocketGateway
  ) {
    this.logger = new Logger('WorkspaceNotificationService');
  }

  /**
   * Notify when a member is added to workspace
   */
  async notifyMemberAdded(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    addedBy: string
  ): Promise<void> {
    try {
      // Notify all workspace members via WebSocket
      this.workspaceGateway.notifyMemberAdded(workspace.id, {
        memberId: member.memberId,
        userId: member.userId,
        email: member.email,
        role: member.role,
      });

      // Send personal notification to the new member
      this.notificationGateway.sendNotification(member.userId, {
        id: `member-added-${workspace.id}-${member.userId}-${Date.now()}`,
        type: NotificationType.SUCCESS,
        title: 'Added to Workspace',
        message: `You have been added to workspace "${workspace.name}" as ${member.role}`,
        data: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          role: member.role,
          addedBy,
        },
        actionUrl: `/workspaces/${workspace.id}`,
        read: false,
        createdAt: new Date(),
      });

      // Notify workspace owner if they didn't add the member
      if (workspace.ownerId !== addedBy && workspace.ownerId !== member.userId) {
        this.notificationGateway.sendNotification(workspace.ownerId, {
          id: `member-added-owner-${workspace.id}-${member.userId}-${Date.now()}`,
          type: NotificationType.INFO,
          title: 'New Member Added',
          message: `${member.email} was added to "${workspace.name}" as ${member.role}`,
          data: {
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            memberEmail: member.email,
            role: member.role,
            addedBy,
          },
          actionUrl: `/workspaces/${workspace.id}/members`,
          read: false,
          createdAt: new Date(),
        });
      }

      this.logger.info('Member added notifications sent', {
        workspaceId: workspace.id,
        userId: member.userId,
        role: member.role,
      });
    } catch (error) {
      this.logger.error('Failed to send member added notifications', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId: workspace.id,
        userId: member.userId,
      });
    }
  }

  /**
   * Notify when a member is removed from workspace
   */
  async notifyMemberRemoved(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    removedBy: string
  ): Promise<void> {
    try {
      // Notify all workspace members
      this.workspaceGateway.notifyMemberRemoved(workspace.id, {
        userId: member.userId,
        email: member.email,
      });

      // Notify the removed member
      this.notificationGateway.sendNotification(member.userId, {
        id: `member-removed-${workspace.id}-${member.userId}-${Date.now()}`,
        type: NotificationType.WARNING,
        title: 'Removed from Workspace',
        message: `You have been removed from workspace "${workspace.name}"`,
        data: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          removedBy,
        },
        read: false,
        createdAt: new Date(),
      });

      // Notify workspace owner if they didn't remove the member
      if (workspace.ownerId !== removedBy && workspace.ownerId !== member.userId) {
        this.notificationGateway.sendNotification(workspace.ownerId, {
          id: `member-removed-owner-${workspace.id}-${member.userId}-${Date.now()}`,
          type: NotificationType.INFO,
          title: 'Member Removed',
          message: `${member.email} was removed from "${workspace.name}"`,
          data: {
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            memberEmail: member.email,
            removedBy,
          },
          actionUrl: `/workspaces/${workspace.id}/members`,
          read: false,
          createdAt: new Date(),
        });
      }

      this.logger.info('Member removed notifications sent', {
        workspaceId: workspace.id,
        userId: member.userId,
      });
    } catch (error) {
      this.logger.error('Failed to send member removed notifications', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId: workspace.id,
        userId: member.userId,
      });
    }
  }

  /**
   * Notify when a member's role is changed
   */
  async notifyMemberRoleChanged(
    workspace: WorkspaceInfo,
    member: MemberInfo,
    oldRole: string,
    newRole: string,
    changedBy: string
  ): Promise<void> {
    try {
      // Notify all workspace members
      this.workspaceGateway.notifyMemberRoleChanged(workspace.id, {
        userId: member.userId,
        newRole,
        changedBy,
      });

      // Notify the affected member
      this.notificationGateway.sendNotification(member.userId, {
        id: `role-changed-${workspace.id}-${member.userId}-${Date.now()}`,
        type: NotificationType.INFO,
        title: 'Role Changed',
        message: `Your role in "${workspace.name}" has been changed from ${oldRole} to ${newRole}`,
        data: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          oldRole,
          newRole,
          changedBy,
        },
        actionUrl: `/workspaces/${workspace.id}`,
        read: false,
        createdAt: new Date(),
      });

      this.logger.info('Role change notifications sent', {
        workspaceId: workspace.id,
        userId: member.userId,
        oldRole,
        newRole,
      });
    } catch (error) {
      this.logger.error('Failed to send role change notifications', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId: workspace.id,
        userId: member.userId,
      });
    }
  }

  /**
   * Notify when workspace details are updated
   */
  async notifyWorkspaceUpdated(
    workspace: WorkspaceInfo,
    changes: Record<string, any>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Notify all workspace members
      this.workspaceGateway.notifyWorkspaceUpdated(workspace.id, {
        name: changes.name,
        description: changes.description,
        updatedBy,
      });

      // Create a human-readable changes message
      const changesText = Object.keys(changes)
        .map(key => `${key}: ${changes[key]}`)
        .join(', ');

      // Send notification to workspace channel
      this.notificationGateway.sendWorkspaceNotification(workspace.id, {
        id: `workspace-updated-${workspace.id}-${Date.now()}`,
        type: NotificationType.INFO,
        title: 'Workspace Updated',
        message: `Workspace "${workspace.name}" has been updated: ${changesText}`,
        data: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          changes,
          updatedBy,
        },
        actionUrl: `/workspaces/${workspace.id}`,
        read: false,
        createdAt: new Date(),
      });

      this.logger.info('Workspace update notifications sent', {
        workspaceId: workspace.id,
        changes: Object.keys(changes),
      });
    } catch (error) {
      this.logger.error('Failed to send workspace update notifications', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId: workspace.id,
      });
    }
  }

  /**
   * Notify when workspace is deleted
   */
  async notifyWorkspaceDeleted(
    workspace: WorkspaceInfo,
    deletedBy: string
  ): Promise<void> {
    try {
      // Send notification to workspace channel (members will receive before disconnect)
      this.notificationGateway.sendWorkspaceNotification(workspace.id, {
        id: `workspace-deleted-${workspace.id}-${Date.now()}`,
        type: NotificationType.ERROR,
        title: 'Workspace Deleted',
        message: `Workspace "${workspace.name}" has been permanently deleted`,
        data: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          deletedBy,
        },
        read: false,
        createdAt: new Date(),
      });

      this.logger.info('Workspace deletion notifications sent', {
        workspaceId: workspace.id,
        deletedBy,
      });
    } catch (error) {
      this.logger.error('Failed to send workspace deletion notifications', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId: workspace.id,
      });
    }
  }
}
