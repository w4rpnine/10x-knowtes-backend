import { useState } from "react";
import type { CreateTopicCommand } from "../../types";
import { getSupabaseClient } from "../../lib/supabase";

// Function to create a new topic
const createTopic = async (supabase: any, userId: string, command: CreateTopicCommand) => {
  const { data, error } = await supabase
    .from("topics")
    .insert([
      {
        title: command.title,
        user_id: userId,
        parent_id: null, // Default to root level
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useCreateTopic = (onTopicCreated: () => void) => {
  // State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateTopicCommand>({ title: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Open dialog
  const openDialog = () => {
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData({ title: "" });
    setError(null);
  };

  // Update form data
  const updateFormData = (data: Partial<CreateTopicCommand>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Submit form
  const submitForm = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError("Topic title cannot be empty");
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

      await createTopic(supabase, userId, formData);
      closeDialog();
      onTopicCreated(); // Refresh topics list
    } catch (err) {
      setError("Failed to create topic: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isDialogOpen,
    formData,
    isSubmitting,
    error,
    openDialog,
    closeDialog,
    updateFormData,
    submitForm,
  };
};
