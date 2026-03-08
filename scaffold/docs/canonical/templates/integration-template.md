# Integration: [System Name]

## Overview

Brief description of the integration and its purpose.

## System Information

| Property | Value |
|----------|-------|
| **System** | [External system name] |
| **API Version** | v2.0 |
| **Documentation** | [Link to API docs] |
| **Support Contact** | support@example.com |

## Authentication

### Method
- OAuth 2.0 / API Key / Basic Auth / etc.

### Credentials
- Stored in: [Environment variable / Secret manager]
- Rotation: [Frequency]

```bash
# Environment variables required
SYSTEM_API_KEY=xxx
SYSTEM_API_SECRET=xxx
```

## Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resource` | GET | Fetch resources |
| `/api/resource` | POST | Create resource |

## Data Mapping

### Inbound (System -> Our System)

| Source Field | Our Field | Transform |
|--------------|-----------|-----------|
| `externalId` | `external_id` | None |
| `createdAt` | `created_at` | ISO -> Unix timestamp |

### Outbound (Our System -> System)

| Our Field | Target Field | Transform |
|-----------|--------------|-----------|
| `id` | `externalId` | None |
| `created_at` | `createdAt` | Unix -> ISO timestamp |

## Sync Strategy

### Direction
- One-way (inbound) / One-way (outbound) / Bidirectional

### Frequency
- Real-time / Scheduled (every X minutes) / On-demand

### Conflict Resolution
- Last write wins / Source system wins / Manual review

## Error Handling

### Retry Strategy
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 | Token expired | Refresh token |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Log and retry |

## Rate Limits

| Limit Type | Value |
|------------|-------|
| Requests/second | 10 |
| Requests/day | 10,000 |
| Batch size | 100 |

## Monitoring

### Health Check
```bash
curl https://api.example.com/health
```

### Metrics to Track
- Sync success rate
- Average sync time
- Error rate by type

### Alerts
- Sync failure > 5 consecutive
- Error rate > 10%

## Troubleshooting

### Issue: Sync not running
1. Check cron job status
2. Verify credentials
3. Check rate limits

### Issue: Data mismatch
1. Compare source and destination records
2. Check transform logic
3. Review sync logs

## References

- [API Documentation](https://docs.example.com)
- [Related ADR](../ADR/adr-XXXX-integration.md)
