import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { z } from "zod";
import { getTopic } from "../../../lib/services/topics.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

const topicIdSchema = z.string().uuid("Topic ID must be a valid UUID");

// Common headers for all responses
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase } = locals as { supabase: SupabaseClient<Database> };
    
    // Validate topic ID parameter
    const topicId = params.id;
    const parseResult = topicIdSchema.safeParse(topicId);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid topic ID format", 
          details: parseResult.error.format() 
        }),
        { status: 400, headers: commonHeaders }
      );
    }
    
    try {
      // Fetch topic with notes using DEFAULT_USER_ID
      const topic = await getTopic(
        supabase,
        DEFAULT_USER_ID,
        topicId
      );
      
      return new Response(
        JSON.stringify(topic),
        { status: 200, headers: commonHeaders }
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Topic not found") {
        return new Response(
          JSON.stringify({ error: "Topic not found" }),
          { status: 404, headers: commonHeaders }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching topic:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: commonHeaders }
    );
  }
};

// Handle OPTIONS requests for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: commonHeaders
  });
}; 