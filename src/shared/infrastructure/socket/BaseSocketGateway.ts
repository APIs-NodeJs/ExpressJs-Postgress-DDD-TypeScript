// src/shared/infrastructure/socket/BaseSocketGateway.ts
import { Server } from 'socket.io';
import { ISocketGateway } from './interfaces/ISocketGateway';
import { AuthenticatedSocket } from './SocketServer';
import { Logger } from '../../../core/utils/Logger';

export abstract class BaseSocketGateway implements ISocketGateway {
  protected io!: Server;
  protected logger: Logger;

  constructor(gatewayName: string) {
    this.logger = new Logger(gatewayName);
  }

  public initialize(io: Server): void {
    this.io = io;
    this.logger.info(`Gateway initialized`);
  }

  public abstract handleConnection(socket: AuthenticatedSocket): void;

  protected emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Emitted ${event} to user ${userId}`);
  }

  protected emitToWorkspace(workspaceId: string, event: string, data: any): void {
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
    this.logger.debug(`Emitted ${event} to workspace ${workspaceId}`);
  }

  protected emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }

  protected handleError(socket: AuthenticatedSocket, error: Error): void {
    this.logger.error('Gateway error', {
      socketId: socket.id,
      userId: socket.userId,
      error: error.message,
    });

    socket.emit('error', {
      message: 'An error occurred',
      code: 'GATEWAY_ERROR',
    });
  }
}
