import { z } from "zod";

/**
 * Schema for validating notes query parameters
 * - is_summary is an optional boolean
 * - limit is an optional number with default value 50
 * - offset is an optional number with default value 0
 */
export const getNotesQuerySchema = z.object({
  is_summary: z.boolean().optional(),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetNotesQuerySchema = z.infer<typeof getNotesQuerySchema>;

/**
 * Schema for validating topic ID parameter
 * - topicId must be a valid UUID
 */
export const topicIdSchema = z.string().uuid("Nieprawidłowy format identyfikatora tematu");

export type TopicIdSchema = z.infer<typeof topicIdSchema>;
