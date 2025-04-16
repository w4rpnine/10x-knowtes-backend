import { defineMiddleware } from "astro:middleware";

import pkg from "@supabase/supabase-js";
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = defineMiddleware((context, next) => {
  context.locals.supabase = pkg;
  return next();
});
