import { z } from "zod";

// Schema for note ID validation
export const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note ID format"),
});

// Schema for updating a note
export const updateNoteSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty").max(150, "Title is too long").optional(),
    content: z.string().max(3000, "Content is too long").optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.content !== undefined,
    "At least one field (title or content) must be provided"
  );

// Type inference helpers
export type NoteIdParams = z.infer<typeof noteIdSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
