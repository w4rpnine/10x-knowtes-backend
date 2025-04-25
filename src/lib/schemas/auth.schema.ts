import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
  remember_me: z.boolean().optional().default(false),
});

export type LoginSchema = typeof loginSchema;
export type LoginInput = z.infer<typeof loginSchema>;
