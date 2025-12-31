# 🔴 High Priority Fixes Implementation Guide

## Overview

This guide provides complete implementation for all 6 HIGH PRIORITY issues identified in the architecture review. These fixes must be implemented before production deployment.

---

## Issue #10: Transactional Outbox Pattern ⚡ CRITICAL

### Problem

Events are published AFTER transaction commit. If event handler fails, data is already persisted, leading to inconsistent state.

### Solution Files Created

1. **OutboxEventModel** - Database model for storing events
2. **OutboxRepository** - Repository for outbox operations
3. **TransactionalEventBus** - Event bus with transactional support
4. **OutboxWorker** - Background worker for processing events
5. **Updated BaseRepository** - Supports saving with events
6. **Updated WorkspaceRepository** - Uses new transactional pattern
7. **Migration SQL** - Creates outbox_events table

### Implementation Steps

#### Step 1: Run Database Migration

```bash
psql -U postgres -d myapp_dev -f migrations/001_create_outbox_events_table.sql
```

Or add to your migration tool:

```typescript
// In your migration script
import { sequelize } from './src/shared/config/database.config';

await sequelize.query(`
  CREATE TABLE IF NOT EXISTS outbox_events (
    -- ... copy from migration file
  );
`);
```

#### Step 2: Update server.ts

Replace your server.ts with the updated version that includes:

- Outbox worker initialization
- Proper error handlers

#### Step 3: Update WorkspaceController

```typescript
// In WorkspaceController methods, use transactional pattern
async create(req: Request, res: Response): Promise<void> {
  // Use transaction decorator or manual transaction
  await this.unitOfWork.start();

  try {
    const result = await this.createWorkspaceUseCase.execute({...});

    if (result.isFailure) {
      await this.unitOfWork.rollback();
      // handle error
      return;
    }

    // Events are automatically saved to outbox during save
    await this.unitOfWork.commit();

    // Background worker will publish events asynchronously
    ResponseHandler.created(res, result.getValue(), 'Workspace created', requestId);
  } catch (error) {
    await this.unitOfWork.rollback();
    throw error;
  }
}
```

#### Step 4: Test the Implementation

```typescript
// Test that events are saved to outbox
const workspace = await workspaceRepository.findById(workspaceId);
workspace.addMember(member);
await workspaceRepository.save(workspace); // Saves events to outbox

// Verify outbox
const events = await sequelize.query(
  'SELECT * FROM outbox_events WHERE aggregate_id = ?',
  { replacements: [workspaceId] }
);
console.log('Events in outbox:', events.length);

// Worker processes events in background
// Check logs for: "Processed pending events"
```

---

## Issue #13: JWT Expiration Validation ⚡ CRITICAL

### Problem

Tokens might never expire if `JWT_EXPIRES_IN` is misconfigured.

### Solution Files Created

1. **ConfigValidator** - Validates all configuration on startup
2. **Updated TokenService** - Uses validated configuration

### Implementation Steps

#### Step 1: Update .env file

Ensure your `.env` has valid duration formats:

```bash
# Valid formats:
JWT_EXPIRES_IN=15m           # 15 minutes
JWT_EXPIRES_IN=1h            # 1 hour
JWT_EXPIRES_IN=3600          # 3600 seconds
JWT_REFRESH_EXPIRES_IN=7d    # 7 days

# Invalid formats (will cause startup error):
# JWT_EXPIRES_IN=invalid
# JWT_EXPIRES_IN=
```

#### Step 2: Test Configuration Validation

```bash
# Run the server - it should validate config on startup
npm run dev

# You should see:
# [ConfigValidator] INFO: Validating configuration...
# [ConfigValidator] INFO: ✅ Configuration validation passed
```

If configuration is invalid:

```bash
# [ConfigValidator] ERROR: Configuration validation failed
# Configuration validation failed:
#   - JWT_SECRET must be at least 32 characters long
#   - JWT_EXPIRES_IN has invalid format
```

#### Step 3: Generate Strong Secrets

```bash
# Generate strong secrets for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update your `.env.production`:

```bash
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

---

## Issue #15: Enable CSRF Verification ⚡ CRITICAL

### Problem

CSRF tokens are generated but never validated.

### Solution Files Created

1. **Updated app.ts** - Enables CSRF verification

### Implementation Steps

#### Step 1: Update app.ts

The updated app.ts now includes CSRF verification for all state-changing operations in production.

#### Step 2: Update Frontend Integration

```typescript
// In your frontend code, get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Include in requests
fetch('/api/v1/workspaces', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

#### Step 3: Test CSRF Protection

```bash
# Should fail without CSRF token
curl -X POST http://localhost:3000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
# Response: 403 CSRF_TOKEN_MISSING

# Should succeed with CSRF token
curl -X POST http://localhost:3000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-cookie>" \
  -d '{"name":"Test"}'
# Response: 201 Created
```

---

## Issue #19: Database Connection Pool ⚡ CRITICAL

### Problem

20 connections max in production insufficient for scale.

### Solution Files Created

1. **Updated database.config.ts** - Better pool configuration

### Implementation Steps

#### Step 1: Update Environment Variables

```bash
# Add to .env.production
DB_POOL_MAX=50  # Increased from 20
DB_POOL_MIN=10  # Increased from 5
```

#### Step 2: Monitor Pool Health

The updated config includes automatic pool monitoring:

```bash
# Watch logs for pool warnings
npm run start | grep "pool"

# You should see:
# [DatabaseConfig] DEBUG: Connection acquired { poolSize: 15, available: 35 }
# [DatabaseConfig] WARN: Database pool heavily utilized { utilizationPercent: '85%' }
```

#### Step 3: Tune Based on Load

Adjust pool size based on your traffic:

```typescript
// Formula: pool_max = (average_concurrent_requests * 2) + buffer
// Example: 100 concurrent requests → pool_max = 50
```

---

## Issue #11: Error Information Leakage ⚡ CRITICAL

### Problem

Stack traces exposed even in development mode.

### Solution Files Created

1. **Updated errorHandler.ts** - Never exposes stack traces to client

### Implementation Steps

#### Step 1: Replace errorHandler.ts

The updated error handler:

- Logs full errors server-side
- Never sends stack traces to clients
- Never exposes database details
- Sanitizes all error messages

#### Step 2: Test Error Handling

```bash
# Trigger an error
curl -X POST http://localhost:3000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Response should NOT contain stack traces:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  },
  "requestId": "...",
  "timestamp": "..."
}

# But server logs SHOULD contain full error:
# [ErrorHandler] ERROR: Request error {
#   error: "Unexpected token",
#   stack: "Error: ...\n at ...",
#   ...
# }
```

---

## Issue #12: Unhandled Promise Rejections ⚡ CRITICAL

### Problem

No global error handlers for unhandled rejections.

### Solution Files Created

1. **Updated server.ts** - Global error handlers

### Implementation Steps

#### Step 1: Replace server.ts

The updated server includes:

- `unhandledRejection` handler
- `uncaughtException` handler
- Graceful shutdown on errors

#### Step 2: Test Error Handling

```typescript
// Add a test endpoint that throws unhandled rejection
router.get('/test-error', async (req, res) => {
  Promise.reject(new Error('Test unhandled rejection'));
  res.send('OK');
});

// Call the endpoint
curl http://localhost:3000/test-error

// Check logs:
// [Server] ERROR: Unhandled Promise Rejection
// [Server] ERROR: Shutting down due to unhandled rejection
// [Server] INFO: ✅ Graceful shutdown completed
```

---

## Complete Implementation Checklist

### Phase 1: Database & Configuration (15 min)

- [ ] Run outbox_events migration
- [ ] Update .env with valid JWT durations
- [ ] Generate strong secrets for production
- [ ] Update DB pool configuration

### Phase 2: Code Updates (30 min)

- [ ] Replace server.ts
- [ ] Replace app.ts
- [ ] Replace database.config.ts
- [ ] Replace errorHandler.ts
- [ ] Replace TokenService.ts
- [ ] Add ConfigValidator.ts
- [ ] Add OutboxEventModel.ts
- [ ] Add OutboxRepository.ts
- [ ] Add TransactionalEventBus.ts
- [ ] Add OutboxWorker.ts
- [ ] Update BaseRepository.ts
- [ ] Update WorkspaceRepository.ts
- [ ] Add securityRateLimiters.ts
- [ ] Update auth.routes.ts

### Phase 3: Testing (30 min)

- [ ] Test configuration validation
- [ ] Test CSRF protection
- [ ] Test outbox pattern
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test graceful shutdown
- [ ] Monitor pool health

### Phase 4: Production Deployment

- [ ] Set all production environment variables
- [ ] Enable CSRF in production
- [ ] Set up monitoring for outbox worker
- [ ] Configure log aggregation
- [ ] Set up alerts for pool warnings

---

## Verification Commands

```bash
# 1. Check configuration validation
npm run dev
# Should see: "✅ Configuration validation passed"

# 2. Check outbox table exists
psql -d myapp_dev -c "\d outbox_events"

# 3. Check rate limiting
for i in {1..15}; do curl -X POST http://localhost:3000/api/v1/auth/login; done
# Should see: 429 Too Many Requests after 10 attempts

# 4. Check CSRF protection (production only)
NODE_ENV=production npm start
curl -X POST http://localhost:3000/api/v1/workspaces -d '{}'
# Should see: 403 CSRF_TOKEN_MISSING

# 5. Check pool monitoring
npm start | grep "pool"
# Should see periodic pool health logs

# 6. Check outbox worker
npm start | grep "Outbox"
# Should see: "Starting outbox worker"
# Should see: "Processed pending events"
```

---

## Rollback Plan

If issues occur after deployment:

1. **Configuration Issues**: Revert .env changes
2. **Database Issues**: Roll back outbox migration
3. **Code Issues**: Revert to previous commit

```bash
# Rollback migration
psql -d myapp_dev -c "DROP TABLE IF EXISTS outbox_events CASCADE;"

# Revert code
git revert HEAD
```

---

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Ensure database migration ran successfully
4. Test each component individually

---

## Next Steps (Medium Priority)

After completing high priority fixes, implement:

1. Extract domain services from use cases
2. Add dependency injection container
3. Implement caching layer
4. Add database indexes
5. Split god controller

See full roadmap in architecture review document.
