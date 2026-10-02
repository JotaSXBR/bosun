// Test-only billing provider used through the BillingProvider interface.
import type {
  BillingEvent,
  BillingProvider,
  CreateCustomerInput,
  CreateSubscriptionInput,
} from "./domain";

export class FakeBillingProvider implements BillingProvider {
  readonly kind = "asaas" as const;

  customers: (CreateCustomerInput & { externalId: string })[] = [];
  subscriptions: (CreateSubscriptionInput & { externalId: string })[] = [];
  canceled: string[] = [];
  queuedEvents: BillingEvent[] = [];
  private counter = 0;

  createCustomer(input: CreateCustomerInput): Promise<{ externalId: string }> {
    const externalId = `cus_fake_${++this.counter}`;
    this.customers.push({ ...input, externalId });
    return Promise.resolve({ externalId });
  }

  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<{ externalId: string; status: "active" | "inactive" }> {
    const externalId = `sub_fake_${++this.counter}`;
    this.subscriptions.push({ ...input, externalId });
    return Promise.resolve({ externalId, status: "active" });
  }

  cancelSubscription(externalId: string): Promise<void> {
    this.canceled.push(externalId);
    return Promise.resolve();
  }

  verifyWebhook(): boolean {
    return true;
  }

  parseWebhook(): BillingEvent[] {
    const events = this.queuedEvents;
    this.queuedEvents = [];
    return events;
  }
}
