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

5. Open your browser and navigate to `http://localhost:3000`

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

- **Authentication System**
  - User registration with email and password
  - User login
  - Secure data storage (encryption)

- **Note Management**
  - Create notes in markdown format
  - Edit existing notes
  - Delete notes
  - Automatic saving during editing

- **Hierarchical Organization**
  - Multi-level grouping of notes into topics (nodes)
  - Unlimited nesting structure
  - Navigation through a tree panel and breadcrumb

- **AI Summary Generation**
  - Generate summaries of notes within a topic
  - Accept or reject generated summaries
  - Save accepted summaries as new notes
  - Standard summary structure (key points, dates, summary, concept list)

- **Reference System**
  - Create references between notes
  - Display references as hyperlinks to original notes

### Features Outside MVP Scope

- Non-text notes
- Markdown syntax formatting
- References to note fragments
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

## Topics

### GET /api/topics
Retrieves a list of topics for the user.

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

## Notes

### GET /api/topics/{topicId}/notes
Retrieves a list of notes for a specific topic.

**Path Parameters:**
- `topicId`: Topic UUID

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

### POST /api/topics/{topicId}/notes
Creates a new note within a specified topic.

**Path Parameters:**
- `topicId`: Topic UUID

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

**Status Codes:**
- 201 Created: Note was successfully created
- 400 Bad Request: Invalid input data
- 404 Not Found: Topic does not exist
- 500 Internal Server Error: Server error
