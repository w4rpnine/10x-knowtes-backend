import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSupabaseClient } from "../lib/supabase";
import type { CreateNoteCommand } from "../types";

interface CreateNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  onNoteCreated: () => void;
}

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ isOpen, onClose, topicId, onNoteCreated }) => {
  const [formData, setFormData] = useState<CreateNoteCommand>({
    title: "",
    content: "",
    is_summary: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data
  const updateFormData = (data: Partial<CreateNoteCommand>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Reset form when dialog closes
  const handleClose = () => {
    setFormData({ title: "", content: "", is_summary: false });
    setError(null);
    onClose();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError("Note title cannot be empty");
      return;
    }

    if (!formData.content.trim()) {
      setError("Note content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const { error } = await supabase.from("notes").insert([
        {
          title: formData.title,
          content: formData.content,
          is_summary: formData.is_summary,
          topic_id: topicId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      onNoteCreated();
      handleClose();
    } catch (err) {
      setError(`Failed to create note: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your topic. Fill in the details and click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="col-span-3"
                disabled={isSubmitting}
                placeholder="Enter note title"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="content" className="text-right text-sm font-medium pt-2">
                Content
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => updateFormData({ content: e.target.value })}
                className="col-span-3 min-h-[150px]"
                disabled={isSubmitting}
                placeholder="Enter note content"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
