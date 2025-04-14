# Topics API

## GET /api/topics

Retrieves a paginated list of topics for the current user.

### Request

- Method: `GET`
- URL: `/api/topics`
- Query Parameters:
  - `limit` (optional): Maximum number of topics to return (default: 50)
  - `offset` (optional): Number of topics to skip for pagination (default: 0)

### Response

#### Success (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "user_id": "uuid"
    }
  ],
  "count": "integer",
  "total": "integer"
}
```

Where:
- `data`: Array of topics
- `count`: Number of topics returned in this response
- `total`: Total number of topics available

#### Error Responses

##### Bad Request (400)

Returned when query parameters are invalid.

```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": {
      "_errors": ["Number must be positive"]
    }
  }
}
```

##### Server Error (500)

```json
{
  "error": "Internal server error"
}
```

### Example

```
GET /api/topics?limit=10&offset=0
```

Response:

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "JavaScript Fundamentals",
      "created_at": "2023-04-01T12:00:00Z",
      "updated_at": "2023-04-01T12:00:00Z",
      "user_id": "00000000-0000-4000-a000-000000000000"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "title": "TypeScript Basics",
      "created_at": "2023-04-02T12:00:00Z",
      "updated_at": "2023-04-02T12:00:00Z", 
      "user_id": "00000000-0000-4000-a000-000000000000"
    }
  ],
  "count": 2,
  "total": 25
}
``` 