// src/shared/infrastructure/socket/interfaces/ISocketEmitter.ts
export interface ISocketEmitter {
  emit(event: string, data: any): void;
  emitToUser(userId: string, event: string, data: any): void;
  emitToWorkspace(workspaceId: string, event: string, data: any): void;
  emitToRoom(room: string, event: string, data: any): void;
}
