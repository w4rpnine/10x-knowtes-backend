import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "./../db/supabase.client";
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
