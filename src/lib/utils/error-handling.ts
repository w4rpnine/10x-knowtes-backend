import type { APIContext } from "astro";
import { ZodError } from "zod";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown): Response {
  if (error instanceof APIError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        details: error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function requireAuth(context: APIContext): void {
  if (!context.locals.session?.user) {
    throw new APIError("Unauthorized", 401);
  }
}

export function validateUserAccess(userId: string | undefined, resourceUserId: string): void {
  if (!userId || userId !== resourceUserId) {
    throw new APIError("Forbidden", 403);
  }
}
