// src/shared/infrastructure/socket/SocketServer.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../../config/env.config';
import { Logger } from '../../../core/utils/Logger';
import { socketAuthMiddleware } from './middlewares/socketAuthMiddleware';
import { ISocketGateway } from './interfaces/ISocketGateway';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  email: string;
  role: string;
  workspaceId?: string;
}

export class SocketServer {
  private io: Server;
  private readonly logger: Logger;
  private gateways: Map<string, ISocketGateway> = new Map();

  constructor(httpServer: HttpServer) {
    this.logger = new Logger('SocketServer');

    this.io = new Server(httpServer, {
      cors: {
        origin: config.ALLOWED_ORIGINS.split(','),
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddlewares();
    this.setupConnectionHandler();
  }

  private setupMiddlewares(): void {
    this.io.use(socketAuthMiddleware);
  }

  private setupConnectionHandler(): void {
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;

      this.logger.info('Client connected', {
        socketId: authSocket.id,
        userId: authSocket.userId,
        email: authSocket.email,
      });

      // Join user-specific room
      authSocket.join(`user:${authSocket.userId}`);

      // Join role-specific room
      authSocket.join(`role:${authSocket.role}`);

      // If user has a workspace context, join workspace room
      if (authSocket.workspaceId) {
        authSocket.join(`workspace:${authSocket.workspaceId}`);
      }

      // Handle disconnection
      authSocket.on('disconnect', reason => {
        this.logger.info('Client disconnected', {
          socketId: authSocket.id,
          userId: authSocket.userId,
          reason,
        });
      });

      // Handle errors
      authSocket.on('error', error => {
        this.logger.error('Socket error', {
          socketId: authSocket.id,
          userId: authSocket.userId,
          error: error.message,
        });
      });

      // Notify all registered gateways
      this.gateways.forEach(gateway => {
        gateway.handleConnection(authSocket);
      });
    });
  }

  public registerGateway(name: string, gateway: ISocketGateway): void {
    this.gateways.set(name, gateway);
    gateway.initialize(this.io);
    this.logger.info(`Gateway registered: ${name}`);
  }

  public getIO(): Server {
    return this.io;
  }

  // Emit to specific user
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit to workspace
  public emitToWorkspace(workspaceId: string, event: string, data: any): void {
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Emit to role
  public emitToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public async close(): Promise<void> {
    return new Promise(resolve => {
      this.io.close(() => {
        this.logger.info('Socket.IO server closed');
        resolve();
      });
    });
  }
}
