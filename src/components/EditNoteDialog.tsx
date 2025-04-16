import React, { useState, useEffect } from "react";
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
import type { UpdateNoteCommand } from "../types";

interface EditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onNoteUpdated: () => void;
}

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({ isOpen, onClose, noteId, onNoteUpdated }) => {
  const [formData, setFormData] = useState<UpdateNoteCommand>({
    title: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data
  const updateFormData = (data: Partial<UpdateNoteCommand>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Load note data when dialog opens
  useEffect(() => {
    const fetchNote = async () => {
      if (!isOpen || !noteId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.from("notes").select("*").eq("id", noteId).single();

        if (error) throw error;

        setFormData({
          title: data.title,
          content: data.content,
        });
      } catch (err) {
        setError(`Failed to load note: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [isOpen, noteId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title?.trim()) {
      setError("Note title cannot be empty");
      return;
    }

    if (!formData.content?.trim()) {
      setError("Note content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

      const { error } = await supabase
        .from("notes")
        .update({
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId);

      if (error) throw error;

      onNoteUpdated();
      onClose();
    } catch (err) {
      setError(`Failed to update note: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>Update the note details. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse mb-4"></div>
            <div className="h-20 bg-muted rounded w-full animate-pulse"></div>
          </div>
        ) : (
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
                  value={formData.title || ""}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="content" className="text-right text-sm font-medium pt-2">
                  Content
                </label>
                <Textarea
                  id="content"
                  value={formData.content || ""}
                  onChange={(e) => updateFormData({ content: e.target.value })}
                  className="col-span-3 min-h-[200px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
