import { z } from "zod";

export const roleSchema = z.enum(["doctor", "patient"]);

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: roleSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type Signup = z.infer<typeof signupSchema>;
export type Login = z.infer<typeof loginSchema>;
