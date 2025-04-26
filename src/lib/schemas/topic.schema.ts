import { z } from "zod";

/**
 * Schema for validating create topic requests
 * - Title is required
 * - Title must be between 1 and 150 characters
 */
export const createTopicSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(150, "Tytuł nie może przekraczać 150 znaków"),
});

export type CreateTopicSchema = z.infer<typeof createTopicSchema>;

// Define the exact shape we expect for update
const titleSchema = z.string().min(1, "Title is required").max(150, "Title must be 150 characters or less").trim();

export const updateTopicSchema = z.object({
  title: titleSchema,
});

export interface UpdateTopicSchema {
  title: string;
}

// UUID validation helper
export const uuidSchema = z.string().uuid("Invalid topic ID");
