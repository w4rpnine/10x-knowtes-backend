import type { SupabaseClient } from "../../db/supabase.client";
import type { LoginCommand, LoginResponseDTO } from "../../types";
import { loginSchema } from "../schemas/auth.schema";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  async login(command: LoginCommand): Promise<LoginResponseDTO> {
    // Validate input
    const validationResult = loginSchema.safeParse(command);
    if (!validationResult.success) {
      throw new AuthenticationError(validationResult.error.errors[0].message);
    }

    // Attempt login with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (error) {
      throw new AuthenticationError(error.message);
    }

    if (!data.session?.expires_at || !data.user?.email || !data.user?.created_at) {
      throw new AuthenticationError("Invalid session or user data");
    }

    // Return formatted response
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: new Date(data.session.expires_at).toISOString(),
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
    };
  }
}
