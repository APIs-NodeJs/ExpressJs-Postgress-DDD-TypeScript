// src/shared/infrastructure/socket/middlewares/socketAuthMiddleware.ts
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { TokenService } from '../../../../modules/auth/domain/services/TokenService';
import { Logger } from '../../../../core/utils/Logger';
import { AuthenticatedSocket } from '../SocketServer';

const logger = new Logger('SocketAuthMiddleware');

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      logger.warn('Socket connection rejected: No token provided', {
        socketId: socket.id,
      });
      return next(new Error('Authentication required'));
    }

    const verifyResult = TokenService.verifyAccessToken(token);

    if (verifyResult.isFailure) {
      logger.warn('Socket connection rejected: Invalid token', {
        socketId: socket.id,
        error: verifyResult.getErrorValue(),
      });
      return next(new Error('Invalid or expired token'));
    }

    const payload = verifyResult.getValue();
    const authSocket = socket as AuthenticatedSocket;

    // Attach user context to socket
    authSocket.userId = payload.userId;
    authSocket.email = payload.email;
    authSocket.role = payload.role;
    authSocket.workspaceId = payload.workspaceId;

    logger.debug('Socket authenticated', {
      socketId: socket.id,
      userId: payload.userId,
      email: payload.email,
    });

    next();
  } catch (error) {
    logger.error('Socket authentication error', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : String(error),
    });
    next(new Error('Authentication failed'));
  }
};

function extractToken(socket: Socket): string | null {
  // Try to get token from handshake auth
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  // Try to get token from query parameters
  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string') {
    return queryToken;
  }

  // Try to get token from headers
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}
