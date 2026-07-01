# NexSyncHub - Deployment & Configuration

This document specifies the required environment variables, configuration parameters, and architectural details for hosting the NexSyncHub web application and socket server.

## 1. Environment Variables Configuration

To run NexSyncHub in production, the following environment variables must be defined in your hosting dashboard or `.env.production` files:

### Database & Caching
*   `MONGODB_URI`: MongoDB connection string containing credentials and collection names.
*   `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL for rate-limiting.
*   `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token for validation.

### Authentication & URLs
*   `NEXTAUTH_SECRET` / `AUTH_SECRET`: Cryptographically random string used to encrypt JWT tokens.
*   `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL`: The canonical URL of your Next.js application (e.g. `https://nexsynchub.com`).

### WebSocket Server
*   `SOCKET_SERVER_URL`: Private URL of the socket server for Next.js backend server-side emits.
*   `NEXT_PUBLIC_SOCKET_URL`: Public WebSocket URL used by clients to establish Socket.IO connections.

### Transactional Emails (Resend)
*   `RESEND_API_KEY`: API key generated from the Resend dashboard.
*   `SUPPORT_EMAIL`: Inbox where platform requests/notifications are routed.
*   `RESEND_FROM_EMAIL`: The verified domain sender identity (e.g. `NexSyncHub <noreply@karanart.com>`).

### Cloud Media & AI Services
*   `AWS_ACCESS_KEY_ID`: IAM user credentials for S3 uploads and Rekognition scans.
*   `AWS_SECRET_ACCESS_KEY`: AWS IAM secret key.
*   `AWS_REGION`: AWS region parameter (e.g. `us-east-1`).
*   `AWS_BUCKET_NAME`: Target S3 bucket for file attachments and avatars.
*   `OPENAI_API_KEY`: OpenAI secret key used for task expansions and ticket suggestions.

### SaaS Billing (Stripe)
*   `STRIPE_SECRET_KEY`: Stripe private API key.
*   `STRIPE_PUBLIC_KEY`: Stripe public key loaded by the frontend checkout scripts.
*   `STRIPE_PRO_PRICE_ID`: Target Stripe product price ID for the Pro plan.
*   `STRIPE_BUSINESS_PRICE_ID`: Stripe product price ID for the Business plan.
*   `STRIPE_WEBHOOK_SECRET`: Secret key used to verify Stripe signature integrity in webhook routes.

### Security Captcha (Cloudflare Turnstile)
*   `NEXT_PUBLIC_TURNSTILE_SITEKEY`: Cloudflare Turnstile public site key.
*   `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key.

## 2. Infrastructure Hosting

NexSyncHub is split into two deployable workloads:

### A. Next.js Web App Deployment
*   **Target Platforms**: Best deployed on platforms like **Vercel** or **Render** supporting Next.js server-side features.
*   **Webhooks Configuration**:
    *   Set up a Stripe Webhook endpoint in your Stripe Developer Dashboard pointing to `https://<your-domain>/api/stripe/webhook`.
    *   Configure it to send `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, and `customer.subscription.deleted` events.

### B. WebSocket Server Deployment
*   **Target Platforms**: Must be hosted on a platform supporting persistent TCP/WebSocket connections (e.g. **Render Web Service**, **Railway**, or **Fly.io**).
*   **Deployment Configuration**: Ensure port redirection is set up correctly (default port `4000`) and the WebSocket server is kept alive (do not use serverless functions for the Socket.IO service).
