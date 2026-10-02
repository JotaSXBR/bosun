// Provider-agnostic billing domain model. Money is always integer cents;
// currency conversion to provider units lives inside adapters.

export type RawWebhookRequest = {
  rawBody: string;
  headers: Record<string, string>;
  query: Record<string, string>;
};

export type CreateCustomerInput = {
  name: string;
  email: string;
  /** CPF/CNPJ, digits only. */
  document: string;
  /** Our organizationId — lets us reconcile provider data back to a tenant. */
  externalReference: string;
};

export type CreateSubscriptionInput = {
  customerExternalId: string;
  amountCents: number;
  cycle: "monthly" | "yearly";
  nextDueDate: Date;
  paymentMethod: "boleto" | "pix" | "credit_card" | "undefined";
  description?: string;
  /** Our reference (e.g. plan/org id). */
  externalReference: string;
};

export type BillingEvent = {
  /** Provider event id — the idempotency key (delivery is at-least-once). */
  eventId: string;
  type:
    | "payment.created"
    | "payment.confirmed"
    | "payment.received"
    | "payment.overdue"
    | "payment.refunded"
    | "payment.deleted"
    | "subscription.canceled";
  externalPaymentId?: string;
  externalSubscriptionId?: string;
  amountCents?: number;
  occurredAt: Date;
};

export interface BillingProvider {
  readonly kind: "asaas";
  createCustomer(input: CreateCustomerInput): Promise<{ externalId: string }>;
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<{ externalId: string; status: "active" | "inactive" }>;
  cancelSubscription(externalId: string): Promise<void>;
  verifyWebhook(request: RawWebhookRequest): boolean;
  parseWebhook(request: RawWebhookRequest): BillingEvent[];
}
