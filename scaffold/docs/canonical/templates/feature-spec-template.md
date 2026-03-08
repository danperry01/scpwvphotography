# Feature: [Feature Name]

## Overview

Brief description of the feature and its purpose.

## User Story

As a [user type], I want to [action] so that [benefit].

## Requirements

### Must Have
- [ ] Requirement 1
- [ ] Requirement 2

### Should Have
- [ ] Requirement 3

### Nice to Have
- [ ] Optional feature 1

## API Contract

### Endpoints

```
METHOD /api/endpoint
Request: { field: type }
Response: { field: type }
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| ERROR_CODE | 400 | Description |

## Database Changes

### New Tables

```sql
CREATE TABLE new_table (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  ...
);
```

### Schema Migrations

Migration file: `migrations/NNNN_feature_name.sql`

## UI/UX

### Screens Affected
- Screen 1
- Screen 2

### User Flow

1. User does X
2. System responds with Y
3. User sees Z

### Wireframes/Mockups

<!-- Link to Figma or attach images -->

## Security Considerations

- [ ] Authentication required
- [ ] Authorization checks in place
- [ ] Input validation
- [ ] Rate limiting (if applicable)
- [ ] Audit logging (if applicable)

## Testing Plan

### Unit Tests
- [ ] Test case 1
- [ ] Test case 2

### Integration Tests
- [ ] Test case 1

### Manual Testing
- [ ] Test scenario 1
- [ ] Test scenario 2

## Performance Considerations

- Expected load: X requests/second
- Data volume: Y records
- Response time target: Z ms

## Rollout Plan

1. Deploy to QA
2. QA testing
3. Deploy to production
4. Monitor metrics

## Documentation Updates

- [ ] API docs updated
- [ ] User guide updated (if applicable)
- [ ] CLAUDE.md updated (if applicable)
