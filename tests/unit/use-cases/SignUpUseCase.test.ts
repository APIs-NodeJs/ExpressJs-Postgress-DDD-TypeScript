import { SignUpUseCase } from "../../../src/modules/auth/application/use-cases/SignUpUseCase";
import { MockUserRepository } from "../../mocks/MockUserRepository";
import { MockWorkspaceRepository } from "../../mocks/MockWorkspaceRepository";
import { MockPasswordHasher } from "../../mocks/MockPasswordHasher";
import { MockTokenService } from "../../mocks/MockTokenService";
import { User } from "../../../src/modules/auth/domain/entities/User";

describe("SignUpUseCase", () => {
  let useCase: SignUpUseCase;
  let userRepo: MockUserRepository;
  let workspaceRepo: MockWorkspaceRepository;
  let passwordHasher: MockPasswordHasher;
  let tokenService: MockTokenService;

  beforeEach(() => {
    userRepo = new MockUserRepository();
    workspaceRepo = new MockWorkspaceRepository();
    passwordHasher = new MockPasswordHasher();
    tokenService = new MockTokenService();

    useCase = new SignUpUseCase(
      userRepo,
      workspaceRepo,
      passwordHasher,
      tokenService
    );
  });

  describe("successful signup", () => {
    it("should create user and workspace", async () => {
      const result = await useCase.execute({
        email: "newuser@example.com",
        password: "Test123!@#",
        name: "New User",
        workspaceName: "New Workspace",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.user.email).toBe("newuser@example.com");
      expect(result.value.user.role).toBe("owner");
      expect(result.value.tokens).toHaveProperty("accessToken");
    });

    it("should hash password before storing", async () => {
      const result = await useCase.execute({
        email: "newuser@example.com",
        password: "Test123!@#",
        name: "New User",
        workspaceName: "New Workspace",
      });

      const user = await userRepo.findByEmail("newuser@example.com");
      expect(user?.password).toBe("hashed_Test123!@#");
    });

    it("should normalize email to lowercase", async () => {
      const result = await useCase.execute({
        email: "NEWUSER@EXAMPLE.COM",
        password: "Test123!@#",
        name: "New User",
        workspaceName: "New Workspace",
      });

      expect(result.value.user.email).toBe("newuser@example.com");
    });
  });

  describe("validation", () => {
    it("should reject weak password", async () => {
      const result = await useCase.execute({
        email: "newuser@example.com",
        password: "weak",
        name: "New User",
        workspaceName: "New Workspace",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Password");
    });

    it("should reject duplicate email", async () => {
      await useCase.execute({
        email: "newuser@example.com",
        password: "Test123!@#",
        name: "New User",
        workspaceName: "New Workspace",
      });

      const result = await useCase.execute({
        email: "newuser@example.com",
        password: "Test123!@#",
        name: "Another User",
        workspaceName: "Another Workspace",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("already exists");
    });
  });
});
