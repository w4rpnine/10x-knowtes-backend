import { z } from "zod";

export const summaryTopicIdSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID format"),
});

export type SummaryTopicIdParams = z.infer<typeof summaryTopicIdSchema>;

export const summaryGenerationResponseSchema = z.object({
  summary_stat_id: z.string().uuid(),
  topic_id: z.string().uuid(),
  note_id: z.string().uuid(),
  status: z.literal("processing"),
});

export type SummaryGenerationResponse = z.infer<typeof summaryGenerationResponseSchema>;
