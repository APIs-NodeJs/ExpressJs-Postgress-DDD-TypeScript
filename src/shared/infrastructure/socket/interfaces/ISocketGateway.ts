// src/shared/infrastructure/socket/interfaces/ISocketGateway.ts
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../SocketServer';

export interface ISocketGateway {
  initialize(io: Server): void;
  handleConnection(socket: AuthenticatedSocket): void;
}
