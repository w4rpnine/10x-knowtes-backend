import React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewTopicDialog } from "./NewTopicDialog";
import { useCreateTopic } from "./hooks/useCreateTopic";
import { useTopicTree } from "./hooks/useTopicTree";

export const NewTopicButton: React.FC = () => {
  const { loadTopics } = useTopicTree();

  const { isDialogOpen, formData, isSubmitting, error, openDialog, closeDialog, updateFormData, submitForm } =
    useCreateTopic(() => {
      // Refresh topic list after creating a new topic
      loadTopics();
    });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={openDialog} className="h-8 w-8 p-0" aria-label="Create new topic">
        <PlusCircle className="h-5 w-5" />
      </Button>

      <NewTopicDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
        error={error}
        title={formData.title}
        onTitleChange={(title) => updateFormData({ title })}
      />
    </>
  );
};
