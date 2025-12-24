import { User } from "../../src/modules/auth/domain/entities/User";
import { Workspace } from "../../src/modules/auth/domain/entities/Workspace";
import { APP_CONSTANTS } from "../../src/config/constants";

export const testUserData = {
  email: "test@example.com",
  password: "Test123!@#",
  name: "Test User",
  workspaceName: "Test Workspace",
};

export const createTestUser = (overrides?: Partial<User>): User => {
  return User.create({
    email: testUserData.email,
    password: "$2b$12$hashedpassword",
    name: testUserData.name,
    role: APP_CONSTANTS.ROLES.OWNER,
    workspaceId: "test-workspace-id",
    ...overrides,
  });
};

export const createTestWorkspace = (
  overrides?: Partial<Workspace>
): Workspace => {
  return Workspace.create({
    name: testUserData.workspaceName,
    ownerId: "test-owner-id",
    ...overrides,
  });
};
