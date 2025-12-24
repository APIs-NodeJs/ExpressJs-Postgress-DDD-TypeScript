import { User } from "./../../../../src/modules/auth/domain/entities/User";
import { APP_CONSTANTS } from "../../../../src/config/constants";

describe("User Entity", () => {
  describe("create", () => {
    it("should create user with valid props", () => {
      const user = User.create({
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.role).toBe(APP_CONSTANTS.ROLES.USER);
      expect(user.workspaceId).toBe("workspace-123");
    });

    it("should generate UUID if not provided", () => {
      const user = User.create({
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe("string");
      expect(user.id.length).toBe(36); // UUID v4 length
    });

    it("should use provided ID", () => {
      const customId = "custom-id-123";
      const user = User.create({
        id: customId,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      expect(user.id).toBe(customId);
    });
  });

  describe("toDTO", () => {
    it("should exclude password from DTO", () => {
      const user = User.create({
        email: "test@example.com",
        password: "secretPassword",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      const dto = user.toDTO();

      expect(dto).not.toHaveProperty("password");
      expect(dto).toHaveProperty("id");
      expect(dto).toHaveProperty("email");
      expect(dto).toHaveProperty("name");
      expect(dto).toHaveProperty("role");
      expect(dto).toHaveProperty("workspaceId");
    });

    it("should return correct DTO structure", () => {
      const user = User.create({
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.OWNER,
        workspaceId: "workspace-123",
      });

      const dto = user.toDTO();

      expect(dto).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.OWNER,
        workspaceId: "workspace-123",
      });
    });
  });
});
