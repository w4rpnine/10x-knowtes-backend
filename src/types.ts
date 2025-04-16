import type { Database } from "./db/database.types";

// Base entity types from database
type TopicEntity = Database["public"]["Tables"]["topics"]["Row"];
type NoteEntity = Database["public"]["Tables"]["notes"]["Row"];
type SummaryStatEntity = Database["public"]["Tables"]["summary_stats"]["Row"];

// DTO Types for API responses
export type TopicDTO = TopicEntity;

export type NoteDTO = NoteEntity;

export type SummaryStatDTO = SummaryStatEntity;

export interface SummaryGenerationResponseDTO {
  summary_stat_id: string;
  topic_id: string;
  note_id: string;
  status: "processing";
}

// Command Models for API requests
export interface CreateTopicCommand {
  title: string;
}

export interface UpdateTopicCommand {
  title: string;
}

export interface CreateNoteCommand {
  title: string;
  content: string;
  is_summary?: boolean; // Optional, defaults to false
}

export interface UpdateNoteCommand {
  title?: string;
  content?: string;
}

// Empty command models for accept/reject operations
export type AcceptSummaryCommand = Record<string, never>;
export type RejectSummaryCommand = Record<string, never>;

// Generic paginated response wrapper
export interface PaginatedResponseDTO<T> {
  data: T[];
  count: number;
  total: number;
}

// Specialized paginated response types for common use cases
export type PaginatedTopicsResponseDTO = PaginatedResponseDTO<TopicDTO>;
export type PaginatedNotesResponseDTO = PaginatedResponseDTO<NoteDTO>;
export type PaginatedSummariesResponseDTO = PaginatedResponseDTO<NoteDTO>;

// View Models
export interface TreeNodeViewModel {
  id: string;
  title: string;
  children: TreeNodeViewModel[];
  isExpanded: boolean;
  level: number;
  type: "topic" | "note";
}

export interface TopicTreeViewModel {
  nodes: TreeNodeViewModel[];
  selectedNodeId: string | null;
}

export interface BreadcrumbItemViewModel {
  id: string;
  title: string;
  level: number;
}
