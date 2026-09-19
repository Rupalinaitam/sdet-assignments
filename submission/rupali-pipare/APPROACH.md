# Subscription & Billing Service – Implementation Approach

## 1. Understanding of the Assignment

The assignment is to design and implement a Subscription & Billing Service using TypeScript.

The service should support:

- Creating subscriptions
- Retrieving subscription details
- Cancelling subscriptions
- Processing payment-provider webhooks
- Managing subscription lifecycle states
- Handling payment success, decline, and timeout scenarios
- Maintaining data persistence and audit history
- Validating webhook signatures and preventing duplicate processing

## 2. API Design

The following APIs are implemented:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/subscriptions` | Create a subscription |
| GET | `/subscriptions/:id` | Retrieve a subscription |
| POST | `/subscriptions/:id/cancel` | Cancel a subscription |
| POST | `/webhooks/payment-provider` | Process payment-provider events |

## 3. Subscription State Machine

The supported subscription states are:

- `trialing`
- `active`
- `past_due`
- `canceled`

Valid transitions include:

- `trialing → active`
- `trialing → past_due`
- `trialing → canceled`
- `active → past_due`
- `active → canceled`
- `past_due → active`
- `past_due → canceled`

Invalid transitions are rejected to protect the consistency of the subscription lifecycle.

A dedicated state machine class is used to centralize and validate state transitions.

## 4. Database Approach

SQLite is used for persistence.

The database contains tables for:

- Subscriptions
- Invoices
- Webhook events
- Audit logs

The repository layer is responsible for database operations and separates persistence logic from business logic.

## 5. Payment Provider Design

A payment-provider interface is used to separate the application from the actual payment provider.

A mock payment provider is implemented for testing scenarios such as:

- Successful payment
- Declined payment
- Payment timeout

This approach allows the payment provider to be replaced or extended without changing the core subscription service.

## 6. Webhook Handling

Webhook processing includes:

1. Reading the raw request body.
2. Validating the HMAC signature.
3. Parsing the JSON payload.
4. Validating required fields.
5. Checking whether the event was already processed.
6. Applying the relevant subscription state transition.
7. Persisting the webhook event and audit information.

Duplicate webhook events are ignored to support idempotent processing.

Out-of-order or stale events are handled without incorrectly regressing the subscription state.

## 7. Design Patterns

The following design patterns and principles are used:

### State Pattern / State Machine

Used to control valid and invalid subscription state transitions.

### Builder Pattern

Used to construct subscription objects in a clear and controlled manner.

### Repository Pattern

Used to isolate database access from business logic.

### Dependency Injection

The subscription service receives its repository and payment-provider dependencies, improving testability and flexibility.

## 8. Testing Strategy

The testing strategy includes:

- Unit tests for the subscription state machine
- Unit tests for the subscription builder
- Unit tests for the mock payment provider
- Repository and persistence tests
- Subscription service tests
- Webhook processing tests
- HMAC signature validation tests
- API-level tests using Supertest

Important scenarios covered include:

- Successful subscription creation
- Invalid input handling
- Valid and invalid state transitions
- Payment success, decline, and timeout
- Valid, invalid, and missing webhook signatures
- Malformed webhook payloads
- Duplicate webhook events
- Missing subscription records
- Unsupported webhook event types

## 9. Validation

The implementation was validated using:

```bash
npm test -- --runInBand