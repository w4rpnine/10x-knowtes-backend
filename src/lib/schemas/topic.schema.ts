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
