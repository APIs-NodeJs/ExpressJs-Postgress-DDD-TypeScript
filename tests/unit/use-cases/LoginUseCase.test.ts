import { LoginUseCase } from "../../../src/modules/auth/application/use-cases/LoginUseCase";
import { MockUserRepository } from "../../mocks/MockUserRepository";
import { MockPasswordHasher } from "../../mocks/MockPasswordHasher";
import { MockTokenService } from "../../mocks/MockTokenService";
import { User } from "../../../src/modules/auth/domain/entities/User";
import { APP_CONSTANTS } from "../../../src/config/constants";

describe("LoginUseCase", () => {
  let useCase: LoginUseCase;
  let userRepo: MockUserRepository;
  let passwordHasher: MockPasswordHasher;
  let tokenService: MockTokenService;
  let lockoutService: any;
  let sessionService: any;

  beforeEach(() => {
    userRepo = new MockUserRepository();
    passwordHasher = new MockPasswordHasher();
    tokenService = new MockTokenService();

    // Mock lockout service
    lockoutService = {
      isLocked: jest.fn().mockResolvedValue(false),
      recordFailedAttempt: jest.fn(),
      resetAttempts: jest.fn(),
      getRemainingLockTime: jest.fn().mockResolvedValue(0),
      getAttempts: jest.fn().mockReturnValue(0),
    };

    // Mock session service
    sessionService = {
      createSession: jest.fn().mockResolvedValue({
        sessionId: "session-123",
        userId: "user-123",
        refreshToken: "refresh_user-123",
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    };

    useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      tokenService,
      lockoutService,
      sessionService
    );
  });

  describe("successful login", () => {
    it("should return user and tokens for valid credentials", async () => {
      const user = User.create({
        id: "user-123",
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      const result = await useCase.execute({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.user.email).toBe("test@example.com");
      expect(result.value.tokens).toHaveProperty("accessToken");
      expect(result.value.tokens).toHaveProperty("refreshToken");
      expect(result.value.session).toHaveProperty("sessionId");
    });

    it("should normalize email to lowercase", async () => {
      const user = User.create({
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      const result = await useCase.execute({
        email: "TEST@EXAMPLE.COM",
        password: "Test123!@#",
      });

      expect(result.isSuccess).toBe(true);
    });

    it("should reset failed attempts on successful login", async () => {
      const user = User.create({
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      await useCase.execute({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(lockoutService.resetAttempts).toHaveBeenCalledWith("user-123");
    });
  });

  describe("failed login", () => {
    it("should return error for non-existent email", async () => {
      const result = await useCase.execute({
        email: "nonexistent@example.com",
        password: "Test123!@#",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid credentials");
    });

    it("should return error for wrong password", async () => {
      const user = User.create({
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      const result = await useCase.execute({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid credentials");
    });

    it("should record failed attempt on wrong password", async () => {
      const user = User.create({
        id: "user-123",
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      await useCase.execute({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(lockoutService.recordFailedAttempt).toHaveBeenCalledWith(
        "user-123"
      );
    });
  });

  describe("account lockout", () => {
    it("should prevent login if account is locked", async () => {
      lockoutService.isLocked.mockResolvedValue(true);
      lockoutService.getRemainingLockTime.mockResolvedValue(1800000); // 30 min

      const user = User.create({
        id: "user-123",
        email: "test@example.com",
        password: "hashed_Test123!@#",
        name: "Test User",
        role: APP_CONSTANTS.ROLES.USER,
        workspaceId: "workspace-123",
      });

      await userRepo.create(user);

      const result = await useCase.execute({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("temporarily locked");
    });
  });
});
