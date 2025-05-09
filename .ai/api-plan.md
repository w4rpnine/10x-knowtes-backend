# REST API Plan for 10x-knowtes

## 1. Resources

- **Topics** - Represents hierarchical organization of notes (`topics` table)
- **Notes** - Contains content of user notes, including AI-generated summaries (`notes` table)
- **Summary Stats** - Tracks statistics about generated summaries (`summary_stats` table)
- **Authentication** - User authentication handled by Supabase Auth (uses `auth.users` table)

## 2. Endpoints

### Topics

- **GET /topics**
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

- **POST /topics**
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

- **GET /topics/{id}**
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

- **PUT /topics/{id}**
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

- **DELETE /topics/{id}**
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

- **GET /topics/{topicId}/notes**
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

- **POST /topics/{topicId}/notes**
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

- **GET /notes/{id}**
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

- **PUT /notes/{id}**
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

- **DELETE /notes/{id}**
  - Description: Delete a note
  - Response: 204 No Content
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

### Summary Generation

- **POST /topics/{topicId}/summaries**
  - Description: Generate a summary for a topic's notes using AI
  - Response Body:
    ```json
    {
      "summary_stat_id": "uuid",
      "title": "string",
      "content": "string"
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /topics/{topicId}/summaries/{summaryId}/accept**
  - Description: Accept a generated summary
  - Response Body:
    ```json
    {
      "summary_stat_id": "uuid"
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /topics/{topicId}/summaries/{summaryId}/reject**
  - Description: Reject a generated summary
  - Response Body:
    ```json
    {
      "summary_stat_id": "uuid"
    }
    ```
  - Success: 204 No Content
  - Errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

## 3. Authentication and Authorization

The application uses Supabase Authentication for handling user authentication. The approach includes:

### Auth Endpoints

- **POST /auth/login**
  - Description: Authenticate a user and issue JWT tokens
  - Request Body:
    ```json
    {
      "email": "string",
      "password": "string",
      "remember_me": "boolean" // Optional, defaults to false
    }
    ```
  - Response Body:
    ```json
    {
      "access_token": "string",
      "refresh_token": "string",
      "user": {
        "id": "uuid",
        "email": "string",
        "created_at": "timestamp"
      },
      "expires_at": "timestamp"
    }
    ```
  - Success: 200 OK
  - Errors: 
    - 400 Bad Request - Invalid email format
    - 401 Unauthorized - Invalid credentials
    - 500 Internal Server Error - Server error during authentication

- **POST /auth/register**
  - Description: Register a new user account
  - Request Body:
    ```json
    {
      "email": "string",
      "password": "string",
      "password_confirmation": "string"
    }
    ```
  - Response Body:
    ```json
    {
      "user": {
        "id": "uuid",
        "email": "string",
        "created_at": "timestamp"
      },
      "message": "Verification email sent"
    }
    ```
  - Success: 201 Created
  - Errors: 
    - 400 Bad Request - Invalid email format, password doesn't meet requirements, or passwords don't match
    - 409 Conflict - Email already in use
    - 500 Internal Server Error - Server error during registration

- **POST /auth/logout**
  - Description: Invalidate the user's session
  - Request Body: None
  - Response Body:
    ```json
    {
      "message": "Successfully logged out"
    }
    ```
  - Success: 200 OK
  - Errors: 
    - 401 Unauthorized - Not authenticated
    - 500 Internal Server Error - Server error during logout

- **POST /auth/password/reset**
  - Description: Request a password reset email
  - Request Body:
    ```json
    {
      "email": "string"
    }
    ```
  - Response Body:
    ```json
    {
      "message": "Password reset email sent"
    }
    ```
  - Success: 200 OK
  - Errors: 
    - 400 Bad Request - Invalid email format
    - 500 Internal Server Error - Server error during password reset request

- **POST /auth/password/update**
  - Description: Update password with reset token
  - Request Body:
    ```json
    {
      "token": "string",
      "password": "string",
      "password_confirmation": "string"
    }
    ```
  - Response Body:
    ```json
    {
      "message": "Password updated successfully"
    }
    ```
  - Success: 200 OK
  - Errors: 
    - 400 Bad Request - Invalid token, password doesn't meet requirements, or passwords don't match
    - 401 Unauthorized - Expired or invalid token
    - 500 Internal Server Error - Server error during password update

### Authentication Mechanisms

1. **JWT-based Authentication**:
   - Each API request must include a valid JWT token in the Authorization header
   - Format: `Authorization: Bearer <token>`
   - Tokens are issued upon successful login/signup
   - The token contains user identity information
   - Session duration is 30 days by default, extended when "Remember me" option is selected

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