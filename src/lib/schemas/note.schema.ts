import { z } from "zod";

/**
 * Schema for validating note ID in URL parameters
 */
export const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note ID format"),
});

/**
 * Schema for validating note update request body
 */
export const updateNoteSchema = z
  .object({
    title: z.string().min(1).max(150).optional(),
    content: z.string().max(3000).optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one field (title or content) must be provided",
  });

/**
 * Schema for validating note creation request body
 */
export const createNoteSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().max(3000),
  is_summary: z.boolean().optional().default(false),
});

// Type inference helpers
export type NoteIdParams = z.infer<typeof noteIdSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
