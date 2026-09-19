
# Kulu SDET Take-Home Assignment

## Subscription & Billing Service

## Overview

This project implements a Subscription & Billing Service using Node.js, Express, TypeScript, and SQLite.

The service supports subscription creation, subscription retrieval, subscription cancellation, payment-provider webhooks, subscription state transitions, audit logging, invoice persistence, and duplicate webhook protection.

---

## Tech Stack

- Node.js
- TypeScript
- Express.js
- SQLite
- better-sqlite3
- Jest
- Supertest
- ts-jest
- dotenv

---

## APIs

### 1. Create Subscription

**POST**

```text
/subscriptions
```

Example request:

```json
{
  "customerId": "customer-001",
  "planId": "basic-monthly",
  "amount": 999
}
```

A newly created subscription starts in the `trialing` state.

---

### 2. Get Subscription

**GET**

```text
/subscriptions/:id
```

Returns the subscription details for the given subscription ID.

---

### 3. Cancel Subscription

**POST**

```text
/subscriptions/:id/cancel
```

Cancels a subscription when the state transition is valid.

---

### 4. Payment Provider Webhook

**POST**

```text
/webhooks/payment-provider
```

The endpoint processes payment-provider events after validating the HMAC signature.

Supported event types include:

- `payment_succeeded`
- `payment_failed`
- `payment_timeout`

---

## Subscription States

The service supports the following states:

- `trialing`
- `active`
- `past_due`
- `canceled`

### Valid State Transitions

| Current State | Event/Action | Next State |
|---|---|---|
| trialing | Payment succeeded | active |
| trialing | Payment failed | past_due |
| active | Payment failed | past_due |
| past_due | Payment succeeded | active |
| past_due | Payment failed | canceled |
| active | Cancel subscription | canceled |
| trialing | Cancel subscription | canceled |

Invalid transitions are rejected with an appropriate error.

Examples of invalid transitions:

- `canceled → active`
- `canceled → past_due`
- `active → trialing`

---

## Design Patterns

### 1. State Pattern / State Machine

The subscription state machine controls valid and invalid subscription transitions.

This prevents invalid lifecycle changes and keeps transition rules centralized.

### 2. Builder Pattern

The subscription builder creates subscription objects with required fields and default values.

This improves object creation readability and consistency.

### 3. Repository Pattern

The repository layer separates database operations from business logic.

It handles:

- Subscription persistence
- Subscription retrieval
- Subscription updates
- Invoice creation
- Webhook event persistence
- Audit log persistence

### 4. Dependency Injection

The payment provider is injected into the subscription service through an interface.

This allows the real payment provider to be replaced with a mock provider during testing.

---

## Payment Provider Mock

A mock payment provider is used to simulate payment outcomes without calling an external service.

Supported outcomes:

- Success
- Decline
- Timeout

The mock provider allows tests to verify:

- Payment behavior
- Provider call count
- Provider arguments
- Subscription state changes

---

## Webhook Security

Webhook requests require an HMAC-SHA256 signature.

The signature is generated using the following environment variable:

```text
WEBHOOK_SECRET
```

The service:

1. Reads the raw request body.
2. Generates the expected HMAC signature.
3. Compares it with the received signature.
4. Rejects invalid or missing signatures.

Invalid or missing signatures return:

```text
401 Unauthorized
```

The signature is calculated using the raw request body to prevent payload modification issues.

---

## Webhook Handling

The service validates:

- Webhook signature
- JSON format
- Required `eventId`
- Required `eventType`
- Required `subscriptionId`
- Supported event type
- Existing subscription

Malformed or invalid requests are rejected.

### Duplicate Webhook Protection

Each webhook event contains a unique `eventId`.

Processed event IDs are persisted in the database. If the same event is received again, it is not processed as a new event.

This provides idempotent webhook handling.

### Out-of-Order Events

The service prevents stale webhook events from incorrectly regressing the subscription state.

---

## Database Design

The SQLite database contains tables for:

- `subscriptions`
- `invoices`
- `webhook_events`
- `audit_logs`

The database stores important lifecycle information, including:

- Subscription creation
- State transitions
- Payment events
- Invoice records
- Webhook processing history
- Audit events

The database uses an in-memory configuration for the automated test environment.

---

## Project Structure

```text
src/
├── app.ts
├── db/
│   └── schema.ts
├── models/
├── repositories/
│   └── subscription-repository.ts
├── routes/
│   ├── subscription-routes.ts
│   └── webhook-routes.ts
├── services/
│   ├── subscription-service.ts
│   └── mock-payment-provider.ts
├── state/
│   └── subscription-state-machine.ts
└── utils/
    └── webhook-signature.ts

tests/
├── app.test.ts
├── subscription-webhook.test.ts
├── webhook-signature.test.ts
├── subscription-service.test.ts
├── subscription-builder.test.ts
├── subscription-repository.test.ts
├── subscription-repository-persistence.test.ts
├── mock-payment-provider.test.ts
├── setup.test.ts
└── subscription-state-machine.test.ts
```

---

## Installation

From the project directory, run:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
WEBHOOK_SECRET=test-webhook-secret
```

The webhook endpoint uses this secret to validate HMAC signatures.

---

## Run Tests

Run all automated tests:

```bash
npm test -- --runInBand
```

Current validation result:

```text
Test Suites: 10 passed, 10 total
Tests:       33 passed, 33 total
```

---

## TypeScript Validation

Run the TypeScript compiler without generating files:

```bash
npm run build
```

The build completes successfully with no TypeScript compilation errors.

---

## Test Coverage

The automated tests cover:

- Health API
- Subscription creation
- Subscription retrieval
- Required field validation
- Subscription cancellation
- Valid state transitions
- Invalid state transitions
- State machine behavior
- Repository operations
- Database persistence
- Payment provider behavior
- Webhook processing
- Valid HMAC signatures
- Invalid HMAC signatures
- Missing signatures
- Malformed JSON payloads
- Duplicate webhook events

---

## Validation Summary

The current implementation has been validated using:

- Jest automated tests
- Supertest API tests
- TypeScript compilation

All 33 automated tests are passing, and the TypeScript build completes successfully.

---

## Limitations

- The payment provider is represented by a mock implementation.
- The database currently uses an in-memory SQLite configuration for testing.
- Authentication and authorization are outside the scope of this assignment.
- Production deployment configuration is not included.
- A real external payment-provider integration is not implemented.

---

## Responsible AI Usage

AI tools were used as development assistance for:

- Exploring implementation approaches
- Reviewing test scenarios
- Improving test coverage
- Troubleshooting TypeScript and testing issues
- Reviewing documentation structure

The implementation, code behavior, test results, and final validation were reviewed and executed locally.