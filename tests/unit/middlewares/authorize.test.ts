import { Request, Response, NextFunction } from "express";
import {
  authorizeRoles,
  authorizePermissions,
} from "../../../src/infrastructure/http/middlewares/authorize";
import { Permission } from "../../../src/modules/auth/domain/value-objects/Permission";
import { AppError } from "../../../src/shared/domain/AppError";

describe("Authorization Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: "user-123",
        workspaceId: "workspace-123",
        email: "test@example.com",
        role: "user",
      },
      path: "/test",
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe("authorizeRoles", () => {
    it("should allow access for authorized role", () => {
      const middleware = authorizeRoles(["user", "admin"]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should deny access for unauthorized role", () => {
      const middleware = authorizeRoles(["admin", "owner"]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it("should require authentication", () => {
      mockRequest.user = undefined;
      const middleware = authorizeRoles(["user"]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it("should allow owner to access admin routes", () => {
      mockRequest.user!.role = "owner";
      const middleware = authorizeRoles(["owner", "admin"]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe("authorizePermissions", () => {
    it("should allow access with required permission", () => {
      mockRequest.user!.role = "admin";
      const middleware = authorizePermissions([Permission.USER_INVITE]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should deny access without required permission", () => {
      mockRequest.user!.role = "user";
      const middleware = authorizePermissions([Permission.USER_INVITE]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it("should require all permissions", () => {
      mockRequest.user!.role = "admin";
      const middleware = authorizePermissions([
        Permission.USER_INVITE,
        Permission.WORKSPACE_DELETE, // Admin doesn't have this
      ]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("should allow owner all permissions", () => {
      mockRequest.user!.role = "owner";
      const middleware = authorizePermissions([
        Permission.USER_INVITE,
        Permission.WORKSPACE_DELETE,
        Permission.FEATURE_DELETE,
      ]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
