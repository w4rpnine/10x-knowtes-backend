import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabaseClient } from "../lib/supabase";

interface DeleteTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicTitle: string;
  onTopicDeleted: () => void;
}

export const DeleteTopicDialog: React.FC<DeleteTopicDialogProps> = ({
  isOpen,
  onClose,
  topicId,
  topicTitle,
  onTopicDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!topicId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

      // First, check if topic has any notes
      const { data: notes, error: notesError } = await supabase.from("notes").select("id").eq("topic_id", topicId);

      if (notesError) throw notesError;

      // If notes exist, prevent deletion
      if (notes && notes.length > 0) {
        throw new Error("Cannot delete topic with existing notes. Delete all notes first.");
      }

      // If no notes, proceed with deletion
      const { error } = await supabase.from("topics").delete().eq("id", topicId);

      if (error) throw error;

      onTopicDeleted();
      onClose();
    } catch (err) {
      setError(`Failed to delete topic: ${(err as Error).message}`);
      // Show error to user, but keep dialog open
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the topic &quot;{topicTitle}&quot; and all its
            data.
            {error && <div className="mt-2 text-destructive font-medium">{error}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
