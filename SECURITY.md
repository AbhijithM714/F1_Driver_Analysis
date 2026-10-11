# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture & Safeguards

The **Formula 1 Race Analytics Platform** incorporates multiple defensive controls:

1. **Path Traversal Prevention (`src/services/dataStore.ts`)**:
   - All server-side dataset reads pass through `safeDataPath()`, which strips directory components via `path.basename()` and verifies that the resolved path stays strictly inside the configured `DATA_DIRECTORY`.
2. **CSV Formula Injection & Prototype Pollution Protection (`src/lib/datasetStore.ts`)**:
   - Client-side dataset uploads validate file size (max 25 MB), reject binary payloads containing null bytes (`\0`), strip `__proto__`/`constructor`/`prototype` keys, and neutralize spreadsheet macro prefixes (`=`, `+`, `@`, `-cmd`).
3. **Zero Secrets in Repository**:
   - No API keys, database passwords, or private tokens are stored in source code. All environment-specific settings are configured via `.env.local` (documented in `.env.example`).
4. **HTTP Security Headers (`vercel.json`)**:
   - Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please open a private security advisory on GitHub or contact the maintainer directly rather than disclosing it in a public issue. We will acknowledge receipt within 48 hours and provide a remediation timeline.

