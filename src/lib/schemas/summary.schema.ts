import { z } from "zod";

/**
 * Schema for validating topic ID parameter
 * - topicId must be a valid UUID
 */
export const topicIdSchema = z.string().uuid("Nieprawidłowy format identyfikatora tematu");

/**
 * Schema for validating summary generation requests
 * Empty object as there are no parameters for now,
 * but can be extended in the future with AI configuration options
 */
export const generateSummarySchema = z.object({
  // Puste lub przyszłe parametry konfiguracyjne
});

// Type inference for TypeScript
export type TopicIdSchema = z.infer<typeof topicIdSchema>;
export type GenerateSummarySchema = z.infer<typeof generateSummarySchema>;
