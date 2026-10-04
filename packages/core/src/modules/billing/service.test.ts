import { describe, expect, it } from "vitest";

import { asaasWebhookPayload, ensureBillingCustomerInput } from "./schemas";
import { ASAAS_PAYMENT_STATUS, paymentStatusForAsaasEvent } from "./service";

describe("asaasWebhookPayload", () => {
  const fullPayload = {
    id: "evt_123",
    event: "PAYMENT_RECEIVED",
    dateCreated: "2026-10-03T10:00:00.000Z",
    payment: {
      id: "pay_123",
      customer: "cus_abc",
      subscription: "sub_xyz",
      status: "RECEIVED",
      value: 199.9,
      netValue: 197.9,
      dueDate: "2026-10-10",
      paymentDate: "2026-10-03",
      clientPaymentDate: "2026-10-03",
      billingType: "PIX",
      invoiceUrl: "https://asaas.com/i/123",
    },
    extraTopLevelKey: { anything: ["goes"] },
  };

  it("accepts a full ASAAS payment payload and tolerates unknown keys", () => {
    const parsed = asaasWebhookPayload.parse(fullPayload);
    expect(parsed.id).toBe("evt_123");
    expect(parsed.event).toBe("PAYMENT_RECEIVED");
    expect(parsed.payment?.customer).toBe("cus_abc");
    expect(parsed.payment?.value).toBe(199.9);
  });

  it("accepts an envelope with no payment object (e.g. subscription events)", () => {
    const parsed = asaasWebhookPayload.parse({
      id: "evt_9",
      event: "SUBSCRIPTION_DELETED",
      subscription: { id: "sub_xyz", customer: "cus_abc" },
    });
    expect(parsed.payment).toBeUndefined();
  });

  it("accepts a payment object with only an id", () => {
    const parsed = asaasWebhookPayload.parse({
      id: "evt_10",
      event: "PAYMENT_DELETED",
      payment: { id: "pay_1" },
    });
    expect(parsed.payment?.id).toBe("pay_1");
  });

  it("rejects payloads without event id or event type", () => {
    expect(asaasWebhookPayload.safeParse({ event: "PAYMENT_CREATED" }).success).toBe(false);
    expect(asaasWebhookPayload.safeParse({ id: "evt_1" }).success).toBe(false);
    expect(asaasWebhookPayload.safeParse({ id: "", event: "X" }).success).toBe(false);
    expect(asaasWebhookPayload.safeParse("a string").success).toBe(false);
    expect(asaasWebhookPayload.safeParse(null).success).toBe(false);
  });
});

describe("paymentStatusForAsaasEvent", () => {
  it("maps every ASAAS payment event to its stored status", () => {
    expect(paymentStatusForAsaasEvent("PAYMENT_CREATED")).toBe("pending");
    expect(paymentStatusForAsaasEvent("PAYMENT_CONFIRMED")).toBe("confirmed");
    expect(paymentStatusForAsaasEvent("PAYMENT_RECEIVED")).toBe("received");
    expect(paymentStatusForAsaasEvent("PAYMENT_OVERDUE")).toBe("overdue");
    expect(paymentStatusForAsaasEvent("PAYMENT_REFUNDED")).toBe("refunded");
    expect(paymentStatusForAsaasEvent("PAYMENT_DELETED")).toBe("deleted");
  });

  it("returns undefined for non-payment or unknown events", () => {
    expect(paymentStatusForAsaasEvent("SUBSCRIPTION_DELETED")).toBeUndefined();
    expect(paymentStatusForAsaasEvent("ANTICIPATION_CREATED")).toBeUndefined();
    expect(paymentStatusForAsaasEvent("")).toBeUndefined();
  });

  it("covers exactly the six statuses allowed by billing_payments", () => {
    expect(Object.values(ASAAS_PAYMENT_STATUS).sort()).toEqual(
      ["confirmed", "deleted", "overdue", "pending", "received", "refunded"].sort(),
    );
  });
});

describe("ensureBillingCustomerInput", () => {
  it("accepts CPF (11 digits) and CNPJ (14 digits)", () => {
    expect(
      ensureBillingCustomerInput.safeParse({
        name: "Org",
        email: "o@crm.local",
        cpfCnpj: "12345678901",
      }).success,
    ).toBe(true);
    expect(
      ensureBillingCustomerInput.safeParse({
        name: "Org",
        email: "o@crm.local",
        cpfCnpj: "12345678000199",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed document and email", () => {
    expect(
      ensureBillingCustomerInput.safeParse({
        name: "Org",
        email: "o@crm.local",
        cpfCnpj: "12.345.678/0001-99",
      }).success,
    ).toBe(false);
    expect(
      ensureBillingCustomerInput.safeParse({
        name: "Org",
        email: "not-an-email",
        cpfCnpj: "12345678901",
      }).success,
    ).toBe(false);
  });
});
