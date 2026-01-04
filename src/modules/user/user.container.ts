// src/modules/user/user.container.ts

import { Router } from 'express';
import { UserQueryRepository } from './infrastructure/repositories/user-query.repository';
import { AuthContainer } from '@modules/auth/auth.container';
import {
  GetUserUseCase,
  UpdateProfileUseCase,
  ListUsersUseCase,
  ChangeStatusUseCase,
  DeleteUserUseCase,
} from './application/use-cases';
import { UserController } from './presentation/controllers/user.controller';
import { createUserRoutes } from './presentation/routes/user.routes';

export class UserContainer {
  private static userQueryRepository: UserQueryRepository;

  private static getUserUseCase: GetUserUseCase;
  private static updateProfileUseCase: UpdateProfileUseCase;
  private static listUsersUseCase: ListUsersUseCase;
  private static changeStatusUseCase: ChangeStatusUseCase;
  private static deleteUserUseCase: DeleteUserUseCase;

  private static userController: UserController;

  static initialize(): void {
    // Repositories
    this.userQueryRepository = new UserQueryRepository();

    // Get shared repositories from AuthContainer
    const userRepository = AuthContainer.getUserRepository();
    const sessionRepository = AuthContainer.getSessionRepository();

    // Use Cases
    this.getUserUseCase = new GetUserUseCase(this.userQueryRepository);

    this.updateProfileUseCase = new UpdateProfileUseCase(userRepository);

    this.listUsersUseCase = new ListUsersUseCase(this.userQueryRepository);

    this.changeStatusUseCase = new ChangeStatusUseCase(userRepository);

    this.deleteUserUseCase = new DeleteUserUseCase(userRepository, sessionRepository);

    // Controllers
    this.userController = new UserController(
      this.getUserUseCase,
      this.updateProfileUseCase,
      this.listUsersUseCase,
      this.changeStatusUseCase,
      this.deleteUserUseCase
    );
  }

  static getUserRoutes(): Router {
    if (!this.userController) {
      this.initialize();
    }
    return createUserRoutes(this.userController);
  }
}
