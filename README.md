# 10x-knowtes

A web application for creating, organizing, and generating AI-powered summaries of notes to enhance learning efficiency.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
- [API Endpoints](#api-endpoints)
- [TODO](#todo)

## Project Description

10x-knowtes is a web application that solves the problem of dispersed information across multiple notes by providing intelligent organization and AI-powered summaries. The application enables users to:

- Create and organize notes in a hierarchical structure without nesting level limitations
- Generate automatic summaries of topics using artificial intelligence
- Create cross-references between related notes
- Navigate through a clear and intuitive interface

The application supports students, professionals, researchers, and hobbyists in effectively managing their notes from any field, making it easier to absorb knowledge and prepare for exams or certifications.

## Tech Stack

### Frontend
- [Astro 5](https://astro.build/)
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)

### Backend
- [Supabase](https://supabase.com/)

### AI Integration
- [Openrouter.ai](https://openrouter.ai/)

### CI/CD & Hosting
- GitHub Actions
- DigitalOcean

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 22.14.0
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/w4rpnine/10x-knowtes.git
   cd 10x-knowtes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # Supabase
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenRouter
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production version of the app
- `npm run preview` - Preview the built app before deployment
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code using Prettier

## Project Scope

### MVP Features

- **Note Management**
  - Create notes in markdown format
  - Edit existing notes
  - Delete notes

- **Hierarchical Organization**
  - Single-level grouping of notes into topics (nodes)
  - Navigation through a tree panel and breadcrumb

- **AI Summary Generation**
  - Generate summaries of notes within a topic
  - Accept or reject generated summaries
  - Save accepted summaries as new notes
  - Standard summary structure (key points, dates, summary, concept list)

### Features Outside MVP Scope

- Non-text notes
- Markdown syntax formatting
- References to notes
- External sources import
- Note sharing between users
- Integration with other note-taking tools
- Mindmap creation
- Quiz generation
- Summary enrichment with external information
- Note enrichment suggestions
- Keyword search
- Theme customization
- Mobile and desktop applications
- Editing generated summaries
- Note templates
- Help system
- Notifications (except UI info about summary generation)

## Project Status

Current version: 0.0.1 (Early Development)

The project is currently in early development. Core features are being implemented and the application is not yet ready for production use.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API Endpoints

### Topics

#### GET /api/topics
Retrieves a list of topics for the user.

```bash
curl -X GET 'http://localhost:3001/api/topics?limit=10&offset=0' \
  -H 'Content-Type: application/json'
```

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:** 
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "count": "integer",
  "total": "integer"
}
```

#### POST /api/topics
Creates a new topic.

```bash
curl -X POST 'http://localhost:3001/api/topics' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My New Topic"
  }'
```

**Request Body:**
```json
{
  "title": "string" // 1-150 characters
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### GET /api/topics/{id}
Retrieves a specific topic by ID.

```bash
curl -X GET 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### PUT /api/topics/{id}
Updates an existing topic.

```bash
curl -X PUT 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Topic Title"
  }'
```

**Request Body:**
```json
{
  "title": "string" // 1-150 characters
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### DELETE /api/topics/{id}
Deletes a topic and all its associated notes.

```bash
curl -X DELETE 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json'
```

**Response:** 204 No Content

### Notes

#### GET /api/topics/{topicId}/notes
Retrieves a list of notes for a specific topic.

```bash
curl -X GET 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/notes?is_summary=false&limit=10&offset=0' \
  -H 'Content-Type: application/json'
```

**Query Parameters:**
- `is_summary` (optional): Filter by summary flag (true/false)
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "topic_id": "uuid",
      "user_id": "uuid",
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

#### POST /api/topics/{topicId}/notes
Creates a new note within a specified topic.

```bash
curl -X POST 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/notes' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My New Note",
    "content": "Note content in markdown format",
    "is_summary": false
  }'
```

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "is_summary": "boolean" // Optional, default is false
}
```

**Response:**
```json
{
  "id": "uuid",
  "topic_id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string",
  "is_summary": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### PUT /api/notes/{id}
Updates an existing note.

```bash
curl -X PUT 'http://localhost:3001/api/notes/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Note Title",
    "content": "Updated note content in markdown format"
  }'
```

**Request Body:**
```json
{
  "title": "string", // Optional, 1-150 characters
  "content": "string" // Optional, max 3000 characters
}
```

**Response:**
```json
{
  "id": "uuid",
  "topic_id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string",
  "is_summary": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### DELETE /api/notes/{id}
Deletes a specific note.

```bash
curl -X DELETE 'http://localhost:3001/api/notes/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json'
```

**Response:** 204 No Content

**Status Codes:**
- 204 No Content: Note successfully deleted
- 400 Bad Request: Invalid note ID format
- 401 Unauthorized: User not authenticated
- 404 Not Found: Note not found or access denied
- 500 Internal Server Error: Server error

### Summaries

#### POST /api/topics/{topicId}/summary
Generates an AI-powered summary for all notes in a topic.

```bash
curl -X POST 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/summary' \
  -H 'Content-Type: "application/json"'
```

**Response:**
```json
{
  "id": "uuid",
  "topic_id": "uuid",
  "status": "string",
  "created_at": "timestamp"
}
```

**Status Codes:**
- 202 Accepted: Summary generation started
- 400 Bad Request: Invalid topic ID
- 404 Not Found: Topic not found or access denied
- 500 Internal Server Error: Server error

Note: All endpoints require appropriate CORS headers and handle OPTIONS requests for preflight checks. Error responses include appropriate HTTP status codes and error messages in the response body.

## TODO

### Security & Performance
- [ ] Implement rate limiting for API endpoints to prevent abuse
  - Consider using Redis or similar for distributed rate limiting
  - Apply rate limits per user and per IP address
  - Add configurable limits for different endpoints
