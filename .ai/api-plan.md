# REST API Plan for 10x-knowtes

## 1. Resources

- **Topics** - Represents hierarchical organization of notes (`topics` table)
- **Notes** - Contains content of user notes, including AI-generated summaries (`notes` table)
- **Summary Stats** - Tracks statistics about generated summaries (`summary_stats` table)
- **Authentication** - User authentication handled by Supabase Auth (uses `auth.users` table)

## 2. Endpoints

### Topics

- **GET /topics - DONE**
  - Description: List all topics for the authenticated user, with all notes that are underneath them.
  - Query Parameters:
    - `limit` (optional): Maximum number of results to return (default: 50)
    - `offset` (optional): Offset for pagination (default: 0)
  - Response Body:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "title": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "notes": [
            {
              "id": "uuid",
              "title": "string",
              "content": "string",
              "is_summary": "boolean",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ]
        }
      ],
      "count": "integer",
      "total": "integer"
    }
    ```
  - Success: 200 OK
  - Errors: 401 Unauthorized

- **POST /topics - DONE**
  - Description: Create a new topic
  - Request Body:
    ```json
    {
      "title": "string",
    }
    ```
  - Response Body:
    ```json
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized

- **GET /topics/{id} - DONE**
  - Description: Get a specific topic
  - Response Body:
    ```json
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /topics/{id} - DONE**
  - Description: Update a topic's details
  - Request Body:
    ```json
    {
      "title": "string"
    }
    ```
  - Response Body:
    ```json
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /topics/{id} - DONE**
  - Description: Delete a topic and all its related notes (cascading delete)
  - Parameters:
    - `id` (required): UUID of the topic to delete
  - Request Body: None
  - Response Body: None
  - Success: 204 No Content
  - Errors:
    - 400 Bad Request - Invalid UUID format
    - 401 Unauthorized - User not authenticated
    - 403 Forbidden - User does not own the topic
    - 404 Not Found - Topic does not exist
    - 500 Internal Server Error - Server error during deletion

### Notes

- **GET /topics/{topicId}/notes - DONE**
  - Description: List all notes for a specific topic
  - Query Parameters:
    - `is_summary` (optional): Filter by summary status
    - `limit` (optional): Maximum number of results to return (default: 50)
    - `offset` (optional): Offset for pagination (default: 0)
  - Response Body:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "topic_id": "uuid",
          "title": "string",
          "content": "string",
          "is_summary": "boolean",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "count": "integer",
      "total": "integer"
    }
    ```
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **POST /topics/{topicId}/notes - DONE**
  - Description: Create a new note in a topic
  - Request Body:
    ```json
    {
      "title": "string",
      "content": "string",
      "is_summary": "boolean" // Optional, defaults to false
    }
    ```
  - Response Body:
    ```json
    {
      "id": "uuid",
      "topic_id": "uuid",
      "title": "string",
      "content": "string",
      "is_summary": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **GET /notes/{id} - TODO**
  - Description: Get a specific note
  - Response Body:
    ```json
    {
      "id": "uuid",
      "topic_id": "uuid",
      "title": "string",
      "content": "string",
      "is_summary": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /notes/{id} - TODO**
  - Description: Update a note
  - Request Body:
    ```json
    {
      "title": "string", // Optional
      "content": "string" // Optional
    }
    ```
  - Response Body:
    ```json
    {
      "id": "uuid",
      "topic_id": "uuid",
      "title": "string",
      "content": "string",
      "is_summary": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /notes/{id} - TODO**
  - Description: Delete a note
  - Response: 204 No Content
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

### Summary Generation

- **POST /topics/{topicId}/summary - DONE**
  - Description: Generate a summary (as a note) for a topic's notes using AI
  - Response Body:
    ```json
    {
      "summary_stat_id": "uuid",
      "topic_id": "uuid",
      "note_id": "uuid"
    }
    ```
  - Success: 202 Accepted
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /summary/{id}/accept - TODO**
  - Description: Accept a generated summary
  - Response Body:
    ```json
    {
      "id": "uuid",
      "topic_id": "uuid",
      "note_id": "uuid",
      "generated_at": "timestamp",
      "accepted": true
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /summary-stats/{id}/reject - TODO**
  - Description: Reject a generated summary
  - Response Body:
    ```json
    {
      "id": "uuid",
      "topic_id": "uuid",
      "note_id": null,
      "generated_at": "timestamp",
      "accepted": false
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

## 3. Authentication and Authorization

The application uses Supabase Authentication for handling user authentication. The approach includes:

1. **JWT-based Authentication**:
   - Each API request must include a valid JWT token in the Authorization header
   - Format: `Authorization: Bearer <token>`
   - Tokens are issued upon successful login/signup
   - The token contains user identity information

2. **Row Level Security (RLS)**:
   - Database-level security using Supabase RLS policies
   - Ensures users can only access their own data
   - API endpoints enforce these same permissions
   - All resources (topics, notes, summary stats) are scoped to the authenticated user

3. **Authorization Flow**:
   - User authenticates via Supabase Auth endpoints
   - Receives JWT tokens (access and refresh)
   - Uses access token for subsequent API requests
   - Refresh token used to get new access tokens when expired

## 4. Validation and Business Logic

### Validation Rules

#### Topics
- Title must be between 1 and 150 characters
- User can only access their own topics

#### Notes
- Title must be at most 150 characters
- Content must be at most 3000 characters
- User can only access notes in topics they own
- Markdown format is supported for content

#### Summary Stats
- User can only access summary stats for their own topics
- Summary generation has a 30-second timeout

### Business Logic Implementation

1. **Note Management**:
   - Notes are always associated with a topic
   - Notes are formatted in Markdown

2. **AI Summary Generation**:
   - Implemented as an synchronous process
   - Summaries are generated following a standard structure:
     - Key points
     - Dates
     - Summary
     - List of concepts
   - Users can accept or reject generated summaries
   - Accepted summaries are saved as notes with is_summary=true
   - Summary generation process should not exceed 30 seconds

3. **Cascading Operations**:
   - Deleting a topic cascades to all its notes and summary stats
   - Deleting a summary note sets related summary_stats.summary_note_id to null

4. **Security and Data Integrity**:
   - All API endpoints enforce row-level security
   - Input validation applied before database operations
   - Appropriate error handling for all operations 