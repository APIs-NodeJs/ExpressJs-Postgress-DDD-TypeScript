// src/shared/infrastructure/socket/setupGateways.ts
import { SocketServer } from './SocketServer';
import { NotificationSocketGateway } from './NotificationSocketGateway';
import { eventBus } from '../../../core/application/EventBus';
import { MemberAddedEventHandler } from '../../../modules/workspaces/application/handlers/MemberAddedEventHandler';
import { WorkspaceCreatedEventHandler } from '../../../modules/workspaces/application/handlers/WorkspaceCreatedEventHandler';
import { sequelize } from '../../config/database.config';
import { SequelizeUnitOfWork } from '../../../core/infrastructure/persistence/SequelizeUnitOfWork';
import { WorkspaceRepository } from '../../../modules/workspaces/infrastructure/persistence/repositories/WorkspaceRepository';
import { UserRepository } from '../../../modules/users/infrastructure/persistence/repositories/UserRepository';
import { WorkspaceSocketGateway } from './WorkspaceSocketGateway';

export function setupSocketGateways(socketServer: SocketServer): void {
  // Initialize repositories
  const unitOfWork = new SequelizeUnitOfWork(sequelize);
  const workspaceRepository = new WorkspaceRepository(unitOfWork);
  const userRepository = new UserRepository(unitOfWork);

  // Initialize gateways
  const workspaceGateway = new WorkspaceSocketGateway(workspaceRepository);
  const notificationGateway = new NotificationSocketGateway();

  // Register gateways with socket server
  socketServer.registerGateway('workspace', workspaceGateway);
  socketServer.registerGateway('notification', notificationGateway);

  // Subscribe event handlers to domain events
  const memberAddedHandler = new MemberAddedEventHandler(
    workspaceGateway,
    notificationGateway,
    userRepository,
    workspaceRepository
  );

  const workspaceCreatedHandler = new WorkspaceCreatedEventHandler(notificationGateway);

  eventBus.subscribe('MemberAddedToWorkspace', memberAddedHandler);
  eventBus.subscribe('WorkspaceCreated', workspaceCreatedHandler);

  // Export gateways for use in controllers if needed
  (global as any).socketGateways = {
    workspace: workspaceGateway,
    notification: notificationGateway,
  };
}

// Helper to get gateways from anywhere in the app
export function getSocketGateways(): {
  workspace: WorkspaceSocketGateway;
  notification: NotificationSocketGateway;
} {
  return (global as any).socketGateways;
}
