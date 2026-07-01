# NexSyncHub - Billing, Subscriptions, & Stripe Integration

This document outlines the Stripe subscription billing infrastructure, Checkout flows, Customer Portals, webhook events, and credit controls used in NexSyncHub.

## 1. Subscription Tiers & AI Usage Quotas

Billing plans are managed on a per-workspace basis. The configuration parameters are defined in `src/lib/billing/plans.ts`:
*   **Billing Tiers**:
    *   `free`: 50 monthly credits, 10 burst credits (rolling 5-hour window).
    *   `pro`: 1,000 monthly credits, 150 burst credits.
    *   `business`: 5,000 monthly credits, 700 burst credits.
*   **AI Feature Costs**:
    *   `task_description_enhance`: 1 credit.
    *   `support_request_enhance`: 1 credit.
    *   `admin_support_summary`: 3 credits.
    *   `workspace_summary`: 5 credits.
    *   `admin_platform_insight`: 5 credits.
    *   `admin_moderation_lab`: 5 credits.
    *   `workspace_digest`: 10 credits.
    *   `workspace_report`: 15 credits.

## 2. Stripe Checkout Flow (Upgrades & Payments)

NexSyncHub uses Stripe Checkout to securely capture credit card details and process subscriptions:
1. **Initiate Upgrade**: The user clicks the "Upgrade" button in the billing dashboard (`/workspace/[workspaceId]/billing`).
2. **Session Creation Request**: The client calls the `/api/billing/checkout` endpoint, passing the target `priceId` (e.g. Pro or Business price identifier) and `workspaceId`.
3. **Stripe Checkout Session**: The backend validates session credentials and calls the Stripe SDK (`stripe.checkout.sessions.create`):
    *   Binds the customer's email or maps their existing `stripeCustomerId`.
    *   Attaches the `workspaceId` and the selected `priceId` to the Stripe Checkout session's metadata.
    *   Provides success and cancel redirect URLs pointing back to the workspace billing dashboard.
4. **Stripe Portal Redirect**: The API returns the checkout URL. The browser redirects the user to Stripe's hosted Checkout page.
5. **Secure Payment Processing**: Stripe captures credit card details and processes the payment securely, then redirects the user back to the success URL.

## 3. Stripe Customer Portal (Subscription Management)

Users can manage existing subscription parameters via Stripe's self-service portal:
*   **Initiation API**: Accessible at the `/api/billing/portal` endpoint.
*   **Portal Session Redirect**: Generates a secure session URL using `stripe.billingPortal.sessions.create` associated with the workspace's `stripeCustomerId`.
*   **Client Management Actions**: Workspace owners are redirected to the Stripe-hosted Customer Portal where they can:
    *   View billing history and download past invoices.
    *   Update payment methods and credit cards.
    *   Upgrade or downgrade active subscription tiers.
    *   Cancel active subscriptions directly, triggering immediate webhook updates in MongoDB.

## 4. Stripe Webhook Synchronization (Idempotency & Listeners)

The webhook endpoint `/api/stripe/webhook` processes events asynchronously from Stripe. It verifies Stripe signatures via `stripe.webhooks.constructEvent` to validate origin and syncs data to the database:
*   **checkout.session.completed**: Fired when a user successfully completes a Stripe Checkout session. Extracts `stripeCustomerId` and binds it to the corresponding `Workspace` record.
*   **invoice.payment_succeeded**: Fired on initial purchases and monthly subscription renewals. Confirms the billing period and resets monthly AI credits.
*   **customer.subscription.updated**: Fired when a user upgrades/downgrades or cancels via the Customer Portal. Resolves the updated price ID to the target `WorkspacePlan` (Free, Pro, or Business) and updates workspace parameters:
    *   `plan`: Set to the corresponding plan.
    *   `subscriptionStatus`: Set to `active` or `trialing`.
    *   `stripeSubscriptionId`: Stripe subscription identifier.
    *   `currentPeriodStart` & `currentPeriodEnd`: Billing period boundaries.
    *   `cancelAtPeriodEnd`: Boolean flag representing cancel status.
*   **customer.subscription.deleted**: Fired when a subscription period expires after cancellation. Resets the workspace's plan status to `free`, updates `subscriptionStatus` to `canceled`, and clears all Stripe metadata fields.

## 5. Monthly AI Credit Reset & Renewal Rules

NexSyncHub resets and refills AI usage credits on a monthly cycle or upon plan upgrades:
*   **Automatic Monthly Reset**: When a subscription renews or a billing period transitions, Stripe fires the `invoice.payment_succeeded` webhook event. The backend listener at `/api/stripe/webhook` captures this event, confirms the new billing period, and automatically resets the workspace's monthly AI credits back to their plan's maximum quota (50 credits for Free, 1,000 for Pro, 5,000 for Business).
*   **Upgrade Credit Refills**: When a user upgrades their plan via Stripe Checkout, the subscription status update resets the AI credits to match the upgraded tier's quota immediately.
*   **Credit Expiration**: Unused AI credits do not roll over to the next billing cycle. They are reset to the maximum quota at the beginning of each billing period.
