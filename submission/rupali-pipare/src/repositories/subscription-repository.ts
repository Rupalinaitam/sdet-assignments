import db from '../db/database';
import {
    Subscription,
    SubscriptionStatus,
} from '../models/subscription';

export class SubscriptionRepository {
    create(subscription: Subscription): void {
        const statement = db.prepare(`
      INSERT INTO subscriptions (
        id,
        customer_id,
        plan_id,
        status,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @customerId,
        @planId,
        @status,
        @createdAt,
        @updatedAt
      )
    `);

        statement.run(subscription);
    }

    findById(id: string): Subscription | undefined {
        const statement = db.prepare(`
      SELECT
        id,
        customer_id AS customerId,
        plan_id AS planId,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM subscriptions
      WHERE id = ?
    `);

        return statement.get(id) as Subscription | undefined;
    }

    updateStatus(
        id: string,
        status: SubscriptionStatus,
        updatedAt: string,
    ): void {
        const statement = db.prepare(`
      UPDATE subscriptions
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

        statement.run(status, updatedAt, id);
    }

    addAuditLog(
        subscriptionId: string,
        previousStatus: SubscriptionStatus | null,
        newStatus: SubscriptionStatus,
        reason: string,
        createdAt: string,
    ): void {
        const statement = db.prepare(`
      INSERT INTO audit_logs (
        subscription_id,
        previous_status,
        new_status,
        reason,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `);

        statement.run(
            subscriptionId,
            previousStatus,
            newStatus,
            reason,
            createdAt,
        );
    }

    createInvoice(
        id: string,
        subscriptionId: string,
        amount: number,
        status: string,
        createdAt: string,
    ): void {
        const statement = db.prepare(`
      INSERT INTO invoices (
        id,
        subscription_id,
        amount,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `);

        statement.run(
            id,
            subscriptionId,
            amount,
            status,
            createdAt,
        );
    }

    saveWebhookEvent(
        eventId: string,
        eventType: string,
        subscriptionId: string,
        payload: string,
        processedAt: string,
    ): void {
        const statement = db.prepare(`
      INSERT INTO webhook_events (
        event_id,
        event_type,
        subscription_id,
        payload,
        processed_at
      )
      VALUES (?, ?, ?, ?, ?)
    `);

        statement.run(
            eventId,
            eventType,
            subscriptionId,
            payload,
            processedAt,
        );
    }

    webhookEventExists(eventId: string): boolean {
        const statement = db.prepare(`
      SELECT event_id
      FROM webhook_events
      WHERE event_id = ?
    `);

        return Boolean(statement.get(eventId));
    }

}