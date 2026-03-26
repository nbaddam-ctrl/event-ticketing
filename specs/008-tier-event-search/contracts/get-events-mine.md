# API Contract: GET /events/mine (Extended)

**Feature**: 008-tier-event-search  
**Type**: REST endpoint extension

## Endpoint

```
GET /api/events/mine
```

## Authentication

- **Required**: JWT Bearer token
- **Roles**: `organizer` or `admin`
- **Scope**: Returns only events owned by the authenticated user

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| page | integer | No | 1 | Page number (min: 1) |
| pageSize | integer | No | 20 | Items per page (min: 1, max: 100) |
| **search** | **string** | **No** | — | **NEW: Case-insensitive partial match on event title and description** |

## Response (200 OK)

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Summer Concert",
      "venueName": "Central Park",
      "startAt": "2026-07-15T18:00:00.000Z",
      "endAt": "2026-07-15T23:00:00.000Z",
      "timezone": "America/New_York",
      "status": "active",
      "cancellationReason": null,
      "totalCapacity": 500,
      "totalSold": 120,
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## Response (empty results)

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## Error Responses

| Status | Code | When |
|---|---|---|
| 401 | UNAUTHORIZED | Missing or invalid JWT |
| 403 | FORBIDDEN | User is not an approved organizer or admin |

## Backward Compatibility

- When `search` is omitted, behavior is identical to the current endpoint (all organizer events, sorted by `created_at DESC`)
- No breaking changes to existing consumers
- Response shape is unchanged
