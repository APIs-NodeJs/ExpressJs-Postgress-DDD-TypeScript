import { Email } from "../../../src/modules/auth/domain/value-objects/Email";

describe("Email Value Object", () => {
  it("should create valid email", () => {
    const email = Email.create("test@example.com");
    expect(email.value).toBe("test@example.com");
  });

  it("should normalize to lowercase", () => {
    const email = Email.create("TEST@EXAMPLE.COM");
    expect(email.value).toBe("test@example.com");
  });

  it("should trim whitespace", () => {
    const email = Email.create("  test@example.com  ");
    expect(email.value).toBe("test@example.com");
  });

  it("should reject invalid email", () => {
    expect(() => Email.create("invalid-email")).toThrow("Invalid email");
  });

  it("should reject email without domain", () => {
    expect(() => Email.create("test@")).toThrow("Invalid email");
  });

  it("should reject email over 255 characters", () => {
    const longEmail = "a".repeat(250) + "@test.com";
    expect(() => Email.create(longEmail)).toThrow("Invalid email");
  });

  it("should compare emails correctly", () => {
    const email1 = Email.create("test@example.com");
    const email2 = Email.create("test@example.com");
    const email3 = Email.create("other@example.com");

    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });
});
