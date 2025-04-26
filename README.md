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

- Create and organize notes in a hierarchical structure
- Generate automatic summaries of topics using artificial intelligenceś
- Navigate through a clear and intuitive interface

The application supports students, professionals, researchers, and hobbyists in effectively managing their notes from any field, making it easier to absorb knowledge and prepare for exams or certifications.

## Tech Stack

### Frontend
- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)

### Backend
- [Supabase](https://supabase.com/)

### AI Integration
- [Openrouter.ai](https://openrouter.ai/)

### Testing
- [Vitest](https://vitest.dev/) - Unit and component testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - DOM testing utilities for React
- [Playwright](https://playwright.dev/) - End-to-end testing

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
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright

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
Retrieves a list of topics with their associated notes.

```bash
curl -X GET 'http://localhost:3001/api/topics?limit=50&offset=0' \
  -H 'Authorization: Bearer <token>' \
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

#### POST /api/topics
Creates a new topic.

```bash
curl -X POST 'http://localhost:3001/api/topics' \
  -H 'Authorization: Bearer <token>' \
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
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### GET /api/topics/{id}
Retrieves a specific topic by ID.

```bash
curl -X GET 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### PUT /api/topics/{id}
Updates an existing topic.

```bash
curl -X PUT 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
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
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### DELETE /api/topics/{id}
Deletes a topic and all its associated notes.

```bash
curl -X DELETE 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:** 204 No Content

### Notes

#### GET /api/topics/{topicId}/notes
Retrieves a list of notes for a specific topic.

```bash
curl -X GET 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/notes?is_summary=false&limit=50&offset=0' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Query Parameters:**
- `is_summary` (optional): Filter by summary flag
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
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

#### POST /api/topics/{topicId}/notes
Creates a new note within a specified topic.

```bash
curl -X POST 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/notes' \
  -H 'Authorization: Bearer <token>' \
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
  "is_summary": "boolean" // Optional, defaults to false
}
```

**Response:**
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

#### GET /api/notes/{id}
Retrieves a specific note.

```bash
curl -X GET 'http://localhost:3001/api/notes/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:**
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

#### PUT /api/notes/{id}
Updates an existing note.

```bash
curl -X PUT 'http://localhost:3001/api/notes/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Note Title",
    "content": "Updated note content"
  }'
```

**Request Body:**
```json
{
  "title": "string", // Optional
  "content": "string" // Optional
}
```

**Response:**
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

#### DELETE /api/notes/{id}
Deletes a specific note.

```bash
curl -X DELETE 'http://localhost:3001/api/notes/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:** 204 No Content

### Summary Generation

#### POST /api/topics/{topicId}/summaries
Generate a summary for a topic's notes using AI.

```bash
curl -X POST 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/summaries' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "summary_stat_id": "uuid",
  "title": "string",
  "content": "string"
}
```

#### PUT /api/topics/{topicId}/summaries/{summaryId}/accept
Accept a generated summary.

```bash
curl -X PUT 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/summaries/123e4567-e89b-12d3-a456-426614174000/accept' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "summary_stat_id": "uuid"
}
```

#### PUT /api/topics/{topicId}/summaries/{summaryId}/reject
Reject a generated summary.

```bash
curl -X PUT 'http://localhost:3001/api/topics/123e4567-e89b-12d3-a456-426614174000/summaries/123e4567-e89b-12d3-a456-426614174000/reject' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "summary_stat_id": "uuid"
}
```

### Error Responses

All endpoints may return the following error status codes:

- 400 Bad Request - Invalid request parameters or body
- 401 Unauthorized - Missing or invalid authentication token
- 403 Forbidden - User does not have permission to access the resource
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error

Error responses will include a JSON body with an error message:

```json
{
  "error": "Error message description"
}
```

Note: All endpoints require JWT authentication via the Authorization header. The token must be included in the format: `Authorization: Bearer <token>`.

## TODO

### Security & Performance
- [ ] Implement rate limiting for API endpoints to prevent abuse
  - Consider using Redis or similar for distributed rate limiting
  - Apply rate limits per user and per IP address
  - Add configurable limits for different endpoints
