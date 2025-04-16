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

interface DeleteNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  onNoteDeleted: () => void;
}

export const DeleteNoteDialog: React.FC<DeleteNoteDialogProps> = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  onNoteDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!noteId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

      // Delete note
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;

      onNoteDeleted();
      onClose();
    } catch (err) {
      setError(`Failed to delete note: ${(err as Error).message}`);
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
            This action cannot be undone. This will permanently delete the note &quot;{noteTitle}&quot; and all its
            content.
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
