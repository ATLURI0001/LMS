# REST API Specifications & Pagination Standards

## Pagination Standards
All collection endpoints require keyset / cursor-based pagination:
`GET /api/v1/courses?limit=25&cursor=eyJpZCI6MTAyNH0=`

## Error Response Envelope
```json
{
  "error": {
    "code": "INVALID_PREREQUISITE",
    "message": "Student has not completed CS101",
    "details": []
  }
}
```
