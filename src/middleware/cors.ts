import type { MiddlewareHandler } from "astro";

/**
 * Common CORS headers used across all responses
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://knowtes.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

/**
 * CORS middleware to handle cross-origin requests
 * This ensures that all necessary headers are set for proper CORS handling
 */
export const corsMiddleware: MiddlewareHandler = async (context, next) => {
  const { request } = context;

  // Immediately handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }

  // For non-OPTIONS requests, get the response and add CORS headers
  const response = await next();

  // If next() didn't return a Response, create one
  if (!(response instanceof Response)) {
    return new Response(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // Add CORS headers to the response
  const newHeaders = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  // Create a new response with the same status, body but with updated headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
