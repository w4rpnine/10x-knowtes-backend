import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().max(3000),
  is_summary: z.boolean().optional().default(false),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
