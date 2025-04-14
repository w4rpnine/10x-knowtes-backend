import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNote } from "../../../lib/services/notes.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Mock notes.service module
vi.mock("../../../lib/services/notes.service", () => ({
  createNote: vi.fn(),
}));

describe("POST /api/topics/:topicId/notes", () => {
  let mockRequest: Request;
  let mockParams: Record<string, string | undefined>;
  let mockLocals: any;
  let mockResponse: Response;

  const validNoteData = {
    title: "Test Note",
    content: "This is a test note content",
    is_summary: false,
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup mock request with valid note data
    mockRequest = new Request("https://example.com/api/topics/123/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validNoteData),
    });

    // Setup mock params
    mockParams = {
      topicId: "123e4567-e89b-12d3-a456-426614174000",
    };

    // Setup mock locals with Supabase client
    mockLocals = {
      supabase: {},
    };
  });

  it("should create a note when request is valid", async () => {
    // Setup mock response from createNote service
    const mockNote = {
      id: "abc-123",
      topic_id: mockParams.topicId,
      user_id: DEFAULT_USER_ID,
      title: validNoteData.title,
      content: validNoteData.content,
      is_summary: validNoteData.is_summary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(createNote).mockResolvedValue(mockNote);

    // Import the endpoint dynamically to ensure mocks are set up first
    const { POST } = await import("../../../pages/api/topics/[topicId]/notes");

    // Call the endpoint
    mockResponse = await POST({
      request: mockRequest,
      params: mockParams,
      locals: mockLocals,
    } as any);

    // Expect the service to be called with the correct parameters
    expect(createNote).toHaveBeenCalledWith(mockLocals.supabase, DEFAULT_USER_ID, mockParams.topicId, validNoteData);

    // Expect a successful response
    expect(mockResponse.status).toBe(201);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to match the mock data
    expect(responseBody).toEqual(mockNote);
  });

  it("should return 400 when topicId is missing", async () => {
    // Import the endpoint dynamically
    const { POST } = await import("../../../pages/api/topics/[topicId]/notes");

    // Call the endpoint with missing topicId
    mockResponse = await POST({
      request: mockRequest,
      params: {},
      locals: mockLocals,
    } as any);

    // Expect a bad request response
    expect(mockResponse.status).toBe(400);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to contain an error message
    expect(responseBody).toHaveProperty("error", "Topic ID is required");
  });

  it("should return 400 when request body is invalid", async () => {
    // Setup request with invalid data (missing title)
    const invalidRequest = new Request("https://example.com/api/topics/123/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "This is a test note content",
      }),
    });

    // Import the endpoint dynamically
    const { POST } = await import("../../../pages/api/topics/[topicId]/notes");

    // Call the endpoint
    mockResponse = await POST({
      request: invalidRequest,
      params: mockParams,
      locals: mockLocals,
    } as any);

    // Expect a bad request response
    expect(mockResponse.status).toBe(400);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to contain validation error details
    expect(responseBody).toHaveProperty("error", "Validation failed");
    expect(responseBody).toHaveProperty("details");
  });

  it("should return 404 when topic is not found", async () => {
    // Setup createNote to return null (topic not found)
    vi.mocked(createNote).mockResolvedValue(null);

    // Import the endpoint dynamically
    const { POST } = await import("../../../pages/api/topics/[topicId]/notes");

    // Call the endpoint
    mockResponse = await POST({
      request: mockRequest,
      params: mockParams,
      locals: mockLocals,
    } as any);

    // Expect a not found response
    expect(mockResponse.status).toBe(404);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to contain an error message
    expect(responseBody).toHaveProperty("error", "Topic not found or access denied");
  });

  it("should return 500 when an unexpected error occurs", async () => {
    // Setup createNote to throw an error
    vi.mocked(createNote).mockRejectedValue(new Error("Database error"));

    // Import the endpoint dynamically
    const { POST } = await import("../../../pages/api/topics/[topicId]/notes");

    // Call the endpoint
    mockResponse = await POST({
      request: mockRequest,
      params: mockParams,
      locals: mockLocals,
    } as any);

    // Expect a server error response
    expect(mockResponse.status).toBe(500);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to contain an error message
    expect(responseBody).toHaveProperty("error", "Internal server error");
  });
});
