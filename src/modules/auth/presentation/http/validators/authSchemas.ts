import { z } from "zod";

export const signUpSchema = {
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email too long")
      .toLowerCase()
      .transform((val) => val.trim()),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .regex(/[A-Z]/, "Password must contain uppercase letter")
      .regex(/[a-z]/, "Password must contain lowercase letter")
      .regex(/[0-9]/, "Password must contain number"),

    firstName: z
      .string()
      .min(1, "First name required")
      .max(100, "First name too long")
      .optional(),

    lastName: z
      .string()
      .min(1, "Last name required")
      .max(100, "Last name too long")
      .optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email format").toLowerCase(),
    password: z.string().min(1, "Password required"),
  }),
};
