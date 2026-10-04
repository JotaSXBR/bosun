import { z } from "zod";

/**
 * Tolerant parser for the ASAAS webhook envelope — only the fields the ingest
 * pipeline reads are declared; unknown keys pass through and the whole object
 * is stored raw in billing_webhook_events.payload.
 * (https://docs.asaas.com/reference/webhook-para-cobrancas)
 */
export const asaasWebhookPayload = z.looseObject({
  /** ASAAS event id — the idempotency key (billing_webhook_events.event_id). */
  id: z.string().min(1),
  /** e.g. PAYMENT_CREATED, PAYMENT_RECEIVED, SUBSCRIPTION_DELETED. */
  event: z.string().min(1),
  dateCreated: z.string().optional(),
  payment: z
    .looseObject({
      id: z.string().optional(),
      customer: z.string().optional(),
      subscription: z.string().optional(),
      status: z.string().optional(),
      /** Value in reais — converted to integer cents at persistence. */
      value: z.number().optional(),
      dueDate: z.string().optional(),
      paymentDate: z.string().optional(),
      clientPaymentDate: z.string().optional(),
    })
    .optional(),
  subscription: z.looseObject({ id: z.string().optional() }).optional(),
});

export type AsaasWebhookPayload = z.infer<typeof asaasWebhookPayload>;

export const listBillingPaymentsInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListBillingPaymentsInput = z.input<typeof listBillingPaymentsInput>;

export const ensureBillingCustomerInput = z.object({
  name: z.string().min(1),
  email: z.email(),
  /** CPF (11) or CNPJ (14), digits only. */
  cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, "cpfCnpj must be 11 (CPF) or 14 (CNPJ) digits"),
});

export type EnsureBillingCustomerInput = z.input<typeof ensureBillingCustomerInput>;
