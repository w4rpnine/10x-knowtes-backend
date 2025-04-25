import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { AuthenticationError, EmailAlreadyInUseError, ValidationError } from "../../../lib/errors/auth.errors";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { RegisterCommand, RegisterResponseDTO } from "../../../types";

export const prerender = false;

// Helper function to get the site URL
function getSiteURL(request: Request): string {
  if (import.meta.env.SITE) {
    return import.meta.env.SITE;
  }

  // Fallback to constructing URL from request
  const host = request.headers.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = (await request.json()) as RegisterCommand;

    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors[0].message);
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const siteUrl = getSiteURL(request);

    // Attempt to register user
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    // Handle Supabase errors
    if (error) {
      if (error.message.includes("already registered")) {
        throw new EmailAlreadyInUseError("Email already in use");
      }
      throw new AuthenticationError(error.message);
    }

    // Validate user data
    if (!data.user?.id || !data.user?.email || !data.user?.created_at) {
      throw new AuthenticationError("Invalid user data received from authentication service");
    }

    // Prepare success response
    const response: RegisterResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      message: "Verification email sent",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof EmailAlreadyInUseError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Server error during registration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
