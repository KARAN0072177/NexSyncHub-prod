# NexSyncHub - Authentication & Security Flows

This document details the authentication procedures, registration workflows, email verifications, rate-limiting, and Turnstile CAPTCHA integrations.

## 1. Authentication Engine (Next-Auth)

NexSyncHub uses Next-Auth for session authentication, implementing a custom credentials provider:
- **Authorization Handler**: Located in `src/lib/auth-options.ts`. It parses `email`, `password`, and the client's `turnstileToken`.
- **User Validation**: Connects to MongoDB, hashes inputs with `bcryptjs`, and compares credentials against database entries.
- **Session Tokens**: JWT-based session tokens storing `id`, `username`, `avatar`, and `role` to support Role-Based Access Control (RBAC).
- **Role Enforcement (RBAC)**: User roles are categorized into `user`, `admin`, and `super_admin` to restrict access parameters based on user rank.

## 2. User Registration Workflow

1. **Input Submission**: Users submit `username`, `email`, and `password` on the frontend register page.
2. **Turnstile Verification**: Frontend requires Turnstile CAPTCHA validation. The generated token is passed in the request body.
3. **Database Checks**: The backend checks for duplicate emails or usernames in the database.
4. **Token Generation**: Generates a cryptographically secure verification token and saves it to the database with an expiration date.
5. **Verification Email**: Sends a verification URL containing the token to the user using the `Resend` email API.
6. **Email Verification Endpoint**: When clicked, the backend hashes the token, checks for validity/expiration, marks the user's `isEmailVerified` as true, and clears verification fields.

## 3. Password Reset Flow (OTP-Based)

1. **Reset Request**: The user submits their email.
2. **OTP Generation**: The system generates a short-lived, secure 6-digit numeric OTP.
3. **Hash Storage**: The OTP is hashed using bcrypt and stored in the database (`PasswordResetToken` collection) with a 10-minute expiry window.
4. **Email Notification**: The plain text OTP is emailed to the user via Resend.
5. **OTP Verification**: The user enters the OTP in the UI. The server validates it against the stored hash and redirects to the reset password page upon success.

## 4. Security & Rate-Limiting

*   **Login Lockouts**: Implemented inside `src/lib/login-rate-limit.ts` using Upstash Redis.
*   **IP locks**: Tracks failed login attempts per IP.
*   **Rate Limits**: If an IP exceeds the attempt threshold, it is locked. The locked IP will experience immediate API blocks, throwing a rate-limit error detailing the remaining cooldown window (`retryAfterSeconds`).
*   **Security Logging**: Centralized security logger (`src/lib/security.ts`) automatically generates security audit logs in the database for events like failed logins, banned actions, password resets, and account registrations.

## 5. Cloudflare Turnstile Integration

*   **Deferred Script Rendering**: Cloudflare Turnstile script loads in the main layout.
*   **Interactive Deferral**: CAPTCHA challenge component (`src/components/global/Turnstile.tsx`) remains unmounted until a user focuses or types inside any form field (Login, Register, and Forgot Password pages). This preserves token validity by avoiding early generation on page load.
*   **Stable React Lifecycles**: The `onVerify` callback is cached using a React `useRef` wrapper. This eliminates rendering loops and avoids DOM cleanup errors by preventing Turnstile from destroying and re-rendering itself on parent state changes.
*   **Backend Verification**: API endpoints validation checks are performed against the challenges endpoint `https://challenges.cloudflare.com/turnstile/v0/siteverify` using the client's token and the platform's `TURNSTILE_SECRET_KEY` environment variable.
