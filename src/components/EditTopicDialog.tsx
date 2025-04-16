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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSupabaseClient } from "../lib/supabase";
import type { UpdateTopicCommand } from "../types";

interface EditTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  onTopicUpdated: () => void;
}

export const EditTopicDialog: React.FC<EditTopicDialogProps> = ({ isOpen, onClose, topicId, onTopicUpdated }) => {
  const [formData, setFormData] = useState<UpdateTopicCommand>({ title: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load topic data when dialog opens
  useEffect(() => {
    const fetchTopic = async () => {
      if (!isOpen || !topicId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.from("topics").select("*").eq("id", topicId).single();

        if (error) throw error;

        setFormData({ title: data.title });
      } catch (err) {
        setError(`Failed to load topic: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [isOpen, topicId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError("Topic title cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

      const { error } = await supabase
        .from("topics")
        .update({
          title: formData.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId);

      if (error) throw error;

      onTopicUpdated();
      onClose();
    } catch (err) {
      setError(`Failed to update topic: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Topic</DialogTitle>
          <DialogDescription>Update the topic title. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
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
                  value={formData.title}
                  onChange={(e) => setFormData({ title: e.target.value })}
                  className="col-span-3"
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
