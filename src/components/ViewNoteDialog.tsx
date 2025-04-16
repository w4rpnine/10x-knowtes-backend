import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";
import { formatDate } from "../lib/utils";
import type { NoteDTO } from "../types";

interface ViewNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export const ViewNoteDialog: React.FC<ViewNoteDialogProps> = ({ isOpen, onClose, noteId, onEdit, onDelete }) => {
  const [note, setNote] = useState<NoteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load note details
  useEffect(() => {
    const fetchNote = async () => {
      if (!isOpen || !noteId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.from("notes").select("*").eq("id", noteId).single();

        if (error) throw error;
        setNote(data);
      } catch (err) {
        setError(`Failed to load note: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [isOpen, noteId]);

  // Handle edit button click
  const handleEdit = () => {
    onClose();
    onEdit(noteId);
  };

  // Handle delete button click
  const handleDelete = () => {
    onClose();
    onDelete(noteId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        {isLoading ? (
          <div className="py-20">
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse mb-8"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : note ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl">{note.title}</DialogTitle>
                  <DialogDescription>
                    {formatDate(note.created_at)}
                    {note.created_at !== note.updated_at && ` • Updated ${formatDate(note.updated_at)}`}
                    {note.is_summary && " • Summary"}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={handleEdit}>
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                  <Button size="sm" variant="destructive" className="flex items-center gap-1" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="my-6 whitespace-pre-wrap">{note.content}</div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">Note not found</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
