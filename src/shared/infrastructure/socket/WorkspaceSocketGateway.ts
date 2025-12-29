// src/modules/workspaces/infrastructure/socket/WorkspaceSocketGateway.ts
import { AuthenticatedSocket } from '../../../shared/infrastructure/socket/SocketServer';
import { BaseSocketGateway } from '../../../shared/infrastructure/socket/BaseSocketGateway';
import { IWorkspaceRepository } from '../../../modules/workspaces/domain/repositories/IWorkspaceRepository';
export class WorkspaceSocketGateway extends BaseSocketGateway {
  constructor(private workspaceRepository: IWorkspaceRepository) {
    super('WorkspaceGateway');
  }

  public handleConnection(socket: AuthenticatedSocket): void {
    this.setupWorkspaceEvents(socket);
  }

  private setupWorkspaceEvents(socket: AuthenticatedSocket): void {
    // Join workspace room
    socket.on('workspace:join', async (data: { workspaceId: string }, callback) => {
      try {
        const { workspaceId } = data;

        // Verify user has access to workspace
        const workspace = await this.workspaceRepository.findById(workspaceId);

        if (!workspace) {
          callback?.({ success: false, error: 'Workspace not found' });
          return;
        }

        const isMember = workspace.isMember(socket.userId);

        if (!isMember) {
          callback?.({ success: false, error: 'Access denied' });
          return;
        }

        // Join workspace room
        socket.join(`workspace:${workspaceId}`);

        this.logger.info('User joined workspace', {
          userId: socket.userId,
          workspaceId,
        });

        callback?.({
          success: true,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            memberCount: workspace.members.length + 1,
          },
        });

        // Notify other members
        socket.to(`workspace:${workspaceId}`).emit('workspace:user_joined', {
          userId: socket.userId,
          email: socket.email,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Error joining workspace', {
          error: error instanceof Error ? error.message : String(error),
        });
        callback?.({ success: false, error: 'Failed to join workspace' });
      }
    });

    // Leave workspace room
    socket.on('workspace:leave', (data: { workspaceId: string }, callback) => {
      const { workspaceId } = data;

      socket.leave(`workspace:${workspaceId}`);

      this.logger.info('User left workspace', {
        userId: socket.userId,
        workspaceId,
      });

      callback?.({ success: true });

      // Notify other members
      socket.to(`workspace:${workspaceId}`).emit('workspace:user_left', {
        userId: socket.userId,
        email: socket.email,
        timestamp: new Date().toISOString(),
      });
    });

    // Get workspace online users
    socket.on(
      'workspace:get_online_users',
      async (data: { workspaceId: string }, callback) => {
        try {
          const { workspaceId } = data;
          const sockets = await this.io.in(`workspace:${workspaceId}`).fetchSockets();

          const onlineUsers = sockets.map(s => {
            const authSocket = s as any;
            return {
              userId: authSocket.userId,
              email: authSocket.email,
              socketId: s.id,
            };
          });

          callback?.({ success: true, users: onlineUsers, count: onlineUsers.length });
        } catch (error) {
          this.logger.error('Error fetching online users', {
            error: error instanceof Error ? error.message : String(error),
          });
          callback?.({ success: false, error: 'Failed to fetch online users' });
        }
      }
    );
  }

  // Method to be called from event handlers
  public notifyMemberAdded(
    workspaceId: string,
    data: {
      memberId: string;
      userId: string;
      email: string;
      role: string;
    }
  ): void {
    this.emitToWorkspace(workspaceId, 'workspace:member_added', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Also notify the new member directly
    this.emitToUser(data.userId, 'workspace:you_were_added', {
      workspaceId,
      role: data.role,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyMemberRemoved(
    workspaceId: string,
    data: {
      userId: string;
      email: string;
    }
  ): void {
    this.emitToWorkspace(workspaceId, 'workspace:member_removed', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Notify the removed user
    this.emitToUser(data.userId, 'workspace:you_were_removed', {
      workspaceId,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyWorkspaceUpdated(
    workspaceId: string,
    data: {
      name?: string;
      description?: string;
      updatedBy: string;
    }
  ): void {
    this.emitToWorkspace(workspaceId, 'workspace:updated', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyMemberRoleChanged(
    workspaceId: string,
    data: {
      userId: string;
      newRole: string;
      changedBy: string;
    }
  ): void {
    this.emitToWorkspace(workspaceId, 'workspace:member_role_changed', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Notify the affected user
    this.emitToUser(data.userId, 'workspace:your_role_changed', {
      workspaceId,
      newRole: data.newRole,
      timestamp: new Date().toISOString(),
    });
  }
}
