# Security Remediation Implementation

## Scope

This implementation addresses the security and reliability findings from the codebase audit. No credentials are included in this document.

## Implemented

- Replaced caller-controlled `x-user-*` identity and role headers with signed, expiring authentication tokens.
- Added HTTP-only `tm_token` cookies for browser sessions. The client no longer persists the token in `localStorage`.
- Added `/auth/me` session restoration and `/auth/logout` cookie invalidation.
- Replaced raw SHA-256 password hashing with salted `scrypt` hashes.
- Rejected empty-password accounts and updated the seed script to use the demo password `password123` in the secure hash format.
- Derived ticket creators, recommendation authors, comments, work logs, and notification owners from the authenticated server principal.
- Added ticket ownership, assignment, and role-aware visibility checks.
- Restricted internal comments and technical work to appropriate staff and assigned/team tickets.
- Added attachment count, size, and MIME allow-list checks on client and server paths.
- Added request limits, a basic process-local request limiter, CORS allow-listing, and security response headers.
- Removed count-based ticket-number generation in favor of collision-resistant identifiers.
- Added role enum validation for administrative role changes.

## Required Environment Configuration

Set these values in the deployment environment:

```text
AUTH_SECRET=<long random secret, at least 32 bytes>
ALLOWED_ORIGINS=https://your-production-portal.example
DATABASE_URL=<private PostgreSQL connection string>
NODE_ENV=production
```

`AUTH_SECRET` is mandatory in production. The development fallback is intentionally unsuitable for deployment.

## Database and Seed Rollout

1. Deploy the code and regenerate the Prisma client.
2. Ensure all existing users have non-empty `scrypt$...` password values. Existing empty or legacy SHA-256 values must be reset through an administrative migration or password reset flow.
3. Run the seed script only in development or an explicitly disposable environment because it deletes existing records.
4. Existing clients must stop sending `x-user-*` headers; `Authorization` is accepted for API clients and browsers use the HTTP-only cookie.
5. Use HTTPS in production so the authentication cookie receives the `Secure` attribute.

## Important Limitations and Follow-up Work

- The token is stateless and expires after eight hours. A database-backed session/revocation table should be added if immediate logout, forced logout, or device/session management is required.
- The request limiter is process-local and resets on restart. Production deployments with multiple instances need a shared Redis or gateway limiter.
- Attachments are still represented as data URLs in the current API. A production implementation should move binary content to private object storage with generated keys, malware scanning, and signed, authorized download URLs.
- Full response shaping should be completed for each role so sensitive fields such as emails and internal comments are excluded where unnecessary.
- Ticket state transitions should be represented by an explicit state machine and audited in a separate event table.
- Recommendation conversion and voting should use database transactions and explicit uniqueness/idempotency constraints.
- Add automated tests for authentication, role escalation, ownership, internal comments, assignment, upload limits, notification isolation, and concurrent operations.

## Validation Performed

- `npm run build` passes after the remediation changes.
- TypeScript diagnostics pass for the touched authentication, controller, service, and hardening files.
- `npm audit --omit=dev` was previously run and reported a transitive `qs` advisory. Re-run it after dependency lockfile remediation and before production deployment.

## Security Verification Checklist

- [ ] Production `AUTH_SECRET` is configured and stored outside source control.
- [ ] Database credentials are private and rotated if `.env` was ever shared or committed.
- [ ] HTTPS is enforced at the deployment edge.
- [ ] `ALLOWED_ORIGINS` contains only trusted production origins.
- [ ] Existing users have secure passwords and no demo credentials remain.
- [ ] A shared rate limiter is configured for multi-instance deployment.
- [ ] Private attachment storage and authorized downloads are implemented.
- [ ] Security regression tests are added and run in CI.
- [ ] Dependency audit is clean or formally accepted with documented exceptions.
