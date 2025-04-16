import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "../lib/supabase";
import { formatDate } from "../lib/utils";
import type { TopicDTO, NoteDTO } from "../types";
import { EditTopicDialog } from "./EditTopicDialog";
import { DeleteTopicDialog } from "./DeleteTopicDialog";
import { CreateNoteDialog } from "./CreateNoteDialog";
import { ViewNoteDialog } from "./ViewNoteDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { DeleteNoteDialog } from "./DeleteNoteDialog";

interface TopicContentProps {
  topicId: string;
}

export const TopicContent: React.FC<TopicContentProps> = ({ topicId }) => {
  const [topic, setTopic] = useState<TopicDTO | null>(null);
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isEditTopicDialogOpen, setIsEditTopicDialogOpen] = useState(false);
  const [isDeleteTopicDialogOpen, setIsDeleteTopicDialogOpen] = useState(false);
  const [isCreateNoteDialogOpen, setIsCreateNoteDialogOpen] = useState(false);
  const [isViewNoteDialogOpen, setIsViewNoteDialogOpen] = useState(false);
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteTitle, setSelectedNoteTitle] = useState<string>("");

  // Load topic and its notes
  const loadTopicContent = async () => {
    if (!topicId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

      // Get topic details
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*")
        .eq("id", topicId)
        .single();

      if (topicError) throw topicError;
      setTopic(topicData);

      // Get notes for this topic
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);
    } catch (err) {
      setError(`Failed to load topic content: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount or when topicId changes
  useEffect(() => {
    loadTopicContent();
  }, [topicId]);

  // Handler for viewing a note
  const handleViewNote = (note: NoteDTO) => {
    setSelectedNoteId(note.id);
    setSelectedNoteTitle(note.title);
    setIsViewNoteDialogOpen(true);
  };

  // Handler for opening edit note dialog
  const handleEditNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsEditNoteDialogOpen(true);
  };

  // Handler for opening delete note dialog
  const handleDeleteNote = (note: NoteDTO) => {
    setSelectedNoteId(note.id);
    setSelectedNoteTitle(note.title);
    setIsDeleteNoteDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-destructive">
        <p>{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // No topic found state
  if (!topic) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Topic not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{topic.title}</h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDate(topic.created_at)}
            {topic.created_at !== topic.updated_at && ` • Updated ${formatDate(topic.updated_at)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setIsEditTopicDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex items-center gap-1"
            onClick={() => setIsDeleteTopicDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notes</h2>
        <Button className="flex items-center gap-1" onClick={() => setIsCreateNoteDialogOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          <span>Add Note</span>
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No notes found for this topic</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first note to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:bg-accent/5 transition-colors">
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
                <CardDescription>
                  {formatDate(note.created_at)}
                  {note.is_summary && " • Summary"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3">{note.content}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleViewNote(note)}>
                  View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEditNote(note.id)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteNote(note)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Topic Dialog */}
      <EditTopicDialog
        isOpen={isEditTopicDialogOpen}
        onClose={() => setIsEditTopicDialogOpen(false)}
        topicId={topicId}
        onTopicUpdated={loadTopicContent}
      />

      {/* Delete Topic Dialog */}
      {topic && (
        <DeleteTopicDialog
          isOpen={isDeleteTopicDialogOpen}
          onClose={() => setIsDeleteTopicDialogOpen(false)}
          topicId={topicId}
          topicTitle={topic.title}
          onTopicDeleted={() => {
            // Navigate back to welcome page
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new Event("popstate"));
          }}
        />
      )}

      {/* Create Note Dialog */}
      <CreateNoteDialog
        isOpen={isCreateNoteDialogOpen}
        onClose={() => setIsCreateNoteDialogOpen(false)}
        topicId={topicId}
        onNoteCreated={loadTopicContent}
      />

      {/* View Note Dialog */}
      {selectedNoteId && (
        <ViewNoteDialog
          isOpen={isViewNoteDialogOpen}
          onClose={() => setIsViewNoteDialogOpen(false)}
          noteId={selectedNoteId}
          onEdit={handleEditNote}
          onDelete={(noteId) => {
            const note = notes.find((n) => n.id === noteId);
            if (note) handleDeleteNote(note);
          }}
        />
      )}

      {/* Edit Note Dialog */}
      {selectedNoteId && (
        <EditNoteDialog
          isOpen={isEditNoteDialogOpen}
          onClose={() => setIsEditNoteDialogOpen(false)}
          noteId={selectedNoteId}
          onNoteUpdated={loadTopicContent}
        />
      )}

      {/* Delete Note Dialog */}
      {selectedNoteId && (
        <DeleteNoteDialog
          isOpen={isDeleteNoteDialogOpen}
          onClose={() => setIsDeleteNoteDialogOpen(false)}
          noteId={selectedNoteId}
          noteTitle={selectedNoteTitle}
          onNoteDeleted={loadTopicContent}
        />
      )}
    </div>
  );
};
