import type { APIRoute } from "astro";
import { AuthService, AuthenticationError } from "../../../lib/services/auth.service";
import { createSupabaseServerInstance } from "../../../lib/services/supabase.server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const authService = new AuthService(supabase);
    const body = await request.json();

    const response = await authService.login(body);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle unexpected errors
    return new Response(JSON.stringify({ error: "Server error during authentication" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
