import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTopics } from "../../lib/services/topics.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

// Mock the topics service
vi.mock("../../lib/services/topics.service", () => ({
  getTopics: vi.fn(),
}));

describe("GET /api/topics", () => {
  let mockRequest: Request;
  let mockLocals: any;
  let mockResponse: Response;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup mock request with default values
    mockRequest = new Request("https://example.com/api/topics");

    // Setup mock locals with Supabase client
    mockLocals = {
      supabase: {},
    };
  });

  it("should return topics when request is valid", async () => {
    // Setup mock response from getTopics service
    const mockTopics = {
      data: [
        { id: "1", title: "Topic 1", created_at: "2023-01-01", updated_at: "2023-01-01", user_id: DEFAULT_USER_ID },
        { id: "2", title: "Topic 2", created_at: "2023-01-02", updated_at: "2023-01-02", user_id: DEFAULT_USER_ID },
      ],
      count: 2,
      total: 10,
    };

    (getTopics as any).mockResolvedValue(mockTopics);

    // Import the endpoint dynamically to ensure mocks are set up first
    const { GET } = await import("../../pages/api/topics/index");

    // Call the endpoint
    mockResponse = await GET({ request: mockRequest, locals: mockLocals } as any);

    // Expect the service to be called with the correct parameters
    expect(getTopics).toHaveBeenCalledWith(mockLocals.supabase, DEFAULT_USER_ID, { limit: 50, offset: 0 });

    // Expect a successful response
    expect(mockResponse.status).toBe(200);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect the response body to match the mock data
    expect(responseBody).toEqual(mockTopics);
  });

  it("should handle query parameters correctly", async () => {
    // Setup request with query parameters
    mockRequest = new Request("https://example.com/api/topics?limit=10&offset=20");

    // Setup mock response from getTopics service
    const mockTopics = { data: [], count: 0, total: 10 };
    (getTopics as any).mockResolvedValue(mockTopics);

    // Import the endpoint dynamically
    const { GET } = await import("../../pages/api/topics/index");

    // Call the endpoint
    mockResponse = await GET({ request: mockRequest, locals: mockLocals } as any);

    // Expect the service to be called with the correct parameters
    expect(getTopics).toHaveBeenCalledWith(mockLocals.supabase, DEFAULT_USER_ID, { limit: 10, offset: 20 });

    // Expect a successful response
    expect(mockResponse.status).toBe(200);
  });

  it("should return 400 for invalid query parameters", async () => {
    // Setup request with invalid query parameters
    mockRequest = new Request("https://example.com/api/topics?limit=-1");

    // Import the endpoint dynamically
    const { GET } = await import("../../pages/api/topics/index");

    // Call the endpoint
    mockResponse = await GET({ request: mockRequest, locals: mockLocals } as any);

    // Expect a bad request response
    expect(mockResponse.status).toBe(400);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect error details in the response
    expect(responseBody.error).toBe("Invalid query parameters");
    expect(responseBody.details).toBeTruthy();
  });

  it("should return 500 when an error occurs", async () => {
    // Setup getTopics to throw an error
    (getTopics as any).mockRejectedValue(new Error("Database error"));

    // Import the endpoint dynamically
    const { GET } = await import("../../pages/api/topics/index");

    // Call the endpoint
    mockResponse = await GET({ request: mockRequest, locals: mockLocals } as any);

    // Expect a server error response
    expect(mockResponse.status).toBe(500);

    // Parse response body
    const responseBody = await mockResponse.json();

    // Expect error message in the response
    expect(responseBody.error).toBe("Internal server error");
  });
});
