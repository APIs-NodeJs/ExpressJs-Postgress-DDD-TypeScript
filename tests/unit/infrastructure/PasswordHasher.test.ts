import { PasswordHasher } from "../../../src/modules/auth/infrastructure/security/PasswordHasher";

describe("PasswordHasher", () => {
  let passwordHasher: PasswordHasher;

  beforeEach(() => {
    passwordHasher = new PasswordHasher();
  });

  describe("hash", () => {
    it("should hash password successfully", async () => {
      const password = "Test123!@#";
      const hash = await passwordHasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it("should generate different hashes for same password", async () => {
      const password = "Test123!@#";
      const hash1 = await passwordHasher.hash(password);
      const hash2 = await passwordHasher.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle long passwords", async () => {
      const longPassword = "A".repeat(100) + "123!@#";
      const hash = await passwordHasher.hash(longPassword);

      expect(hash).toBeDefined();
    });
  });

  describe("compare", () => {
    it("should verify correct password", async () => {
      const password = "Test123!@#";
      const hash = await passwordHasher.hash(password);

      const isValid = await passwordHasher.compare(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "Test123!@#";
      const wrongPassword = "Wrong123!@#";
      const hash = await passwordHasher.hash(password);

      const isValid = await passwordHasher.compare(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should be case sensitive", async () => {
      const password = "Test123!@#";
      const wrongCase = "test123!@#";
      const hash = await passwordHasher.hash(password);

      const isValid = await passwordHasher.compare(wrongCase, hash);

      expect(isValid).toBe(false);
    });
  });
});
