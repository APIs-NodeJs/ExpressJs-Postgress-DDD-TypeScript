import { Response } from "express";
import { AuthRequest } from "../middlewares/authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { GetUserRoleUseCase } from "@modules/auth/application/use-cases/GetUserRoleUseCase";
import { AssignRoleUseCase } from "@modules/auth/application/use-cases/AssignRoleUseCase";
import { RemoveRoleUseCase } from "@modules/auth/application/use-cases/RemoveRoleUseCase";
import { GetUsersByRoleUseCase } from "@modules/auth/application/use-cases/GetUsersByRoleUseCase";

import { UserRoleRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRoleRepository";
import { UserRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRepository";

export class RoleController {
  private getUserRoleUseCase: GetUserRoleUseCase;
  private assignRoleUseCase: AssignRoleUseCase;
  private removeRoleUseCase: RemoveRoleUseCase;
  private getUsersByRoleUseCase: GetUsersByRoleUseCase;

  constructor() {
    const userRoleRepository = new UserRoleRepository();
    const userRepository = new UserRepository();

    this.getUserRoleUseCase = new GetUserRoleUseCase(userRoleRepository);
    this.assignRoleUseCase = new AssignRoleUseCase(
      userRoleRepository,
      userRepository
    );
    this.removeRoleUseCase = new RemoveRoleUseCase(userRoleRepository);
    this.getUsersByRoleUseCase = new GetUsersByRoleUseCase(
      userRoleRepository,
      userRepository
    );
  }

  getUserRole = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;

      const result = await this.getUserRoleUseCase.execute(userId);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get user role error:", error);
      return ApiResponse.internalError(res);
    }
  };

  assignRole = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const result = await this.assignRoleUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Assign role error:", error);
      return ApiResponse.internalError(res);
    }
  };

  removeRole = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;

      const result = await this.removeRoleUseCase.execute(userId);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.noContent(res);
    } catch (error) {
      console.error("Remove role error:", error);
      return ApiResponse.internalError(res);
    }
  };

  getUsersByRole = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      const { role } = req.params;

      if (!["admin", "moderator", "user"].includes(role)) {
        return ApiResponse.badRequest(res, "Invalid role");
      }

      const result = await this.getUsersByRoleUseCase.execute(
        role as "admin" | "moderator" | "user"
      );

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get users by role error:", error);
      return ApiResponse.internalError(res);
    }
  };
}
