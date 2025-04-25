import type { Database } from "./db/database.types";
import type { SupabaseClient } from "./db/supabase.client";

// Base entity types from database
type TopicEntity = Database["public"]["Tables"]["topics"]["Row"];
type NoteEntity = Database["public"]["Tables"]["notes"]["Row"];
type SummaryStatEntity = Database["public"]["Tables"]["summary_stats"]["Row"];

// DTO Types for API responses
export type TopicDTO = TopicEntity & {
  notes?: NoteDTO[];
};

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
  title: NonNullable<string>;
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

// Auth related types
export interface LoginCommand {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginResponseDTO {
  access_token: string;
  refresh_token: string;
  user: UserDTO;
  expires_at: string;
}

export interface RegisterCommand {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponseDTO {
  user: UserDTO;
  message: string;
}

// Extend Astro's Locals interface
declare module "astro" {
  interface Locals {
    supabase: SupabaseClient;
    session: {
      user: {
        id: string;
        email?: string;
        role?: string;
        [key: string]: string | undefined;
      };
    } | null;
    request: Request;
  }
}
