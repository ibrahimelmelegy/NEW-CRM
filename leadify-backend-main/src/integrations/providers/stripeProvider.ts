// ─── Stripe Payment Gateway Provider ─────────────────────────────────────────
// Uses real Stripe SDK when STRIPE_SECRET_KEY is set, otherwise returns mock data.

export interface StripeCustomerInput {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentInput {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscriptionInput {
  customerId: string;
  priceId: string;
  trialDays?: number;
}

export interface StripeRefundInput {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export interface StripeResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class StripeProvider {
  private stripe: any = null;

  static isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  private getClient() {
    if (!this.stripe && StripeProvider.isConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require('stripe');
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      } catch (err) {
        console.error('[StripeProvider] Failed to initialize Stripe SDK:', err);
      }
    }
    return this.stripe;
  }

  async createCustomer(input: StripeCustomerInput): Promise<StripeResult<{ id: string; email: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const customer = await client.customers.create({ email: input.email, name: input.name, metadata: input.metadata });
        return { success: true, data: { id: customer.id, email: customer.email }, mock: false };
      }
      return { success: true, data: { id: `mock_cus_${Date.now()}`, email: input.email }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] createCustomer error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }

  async createPaymentIntent(input: StripePaymentIntentInput): Promise<StripeResult<{ id: string; clientSecret: string; status: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const pi = await client.paymentIntents.create({
          amount: input.amount,
          currency: input.currency,
          customer: input.customerId,
          description: input.description,
          metadata: input.metadata
        });
        return { success: true, data: { id: pi.id, clientSecret: pi.client_secret, status: pi.status }, mock: false };
      }
      return {
        success: true,
        data: { id: `mock_pi_${Date.now()}`, clientSecret: `mock_secret_${Date.now()}`, status: 'requires_payment_method' },
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] createPaymentIntent error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }

  async createSubscription(input: StripeSubscriptionInput): Promise<StripeResult<{ id: string; status: string; currentPeriodEnd: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const sub = await client.subscriptions.create({
          customer: input.customerId,
          items: [{ price: input.priceId }],
          trial_period_days: input.trialDays
        });
        return { success: true, data: { id: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end }, mock: false };
      }
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
      return { success: true, data: { id: `mock_sub_${Date.now()}`, status: 'active', currentPeriodEnd: periodEnd }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] createSubscription error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<StripeResult<{ id: string; status: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const sub = await client.subscriptions.cancel(subscriptionId);
        return { success: true, data: { id: sub.id, status: sub.status }, mock: false };
      }
      return { success: true, data: { id: subscriptionId, status: 'canceled' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] cancelSubscription error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }

  async createRefund(input: StripeRefundInput): Promise<StripeResult<{ id: string; status: string; amount: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const refund = await client.refunds.create({
          payment_intent: input.paymentIntentId,
          amount: input.amount,
          reason: input.reason
        });
        return { success: true, data: { id: refund.id, status: refund.status, amount: refund.amount }, mock: false };
      }
      return { success: true, data: { id: `mock_re_${Date.now()}`, status: 'succeeded', amount: input.amount || 0 }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] createRefund error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }

  async listInvoices(customerId?: string, limit = 10): Promise<StripeResult<Array<{ id: string; amount: number; status: string; created: number }>>> {
    try {
      const client = this.getClient();
      if (client) {
        const params: any = { limit };
        if (customerId) params.customer = customerId;
        const invoices = await client.invoices.list(params);
        const items = invoices.data.map((inv: any) => ({ id: inv.id, amount: inv.amount_due, status: inv.status, created: inv.created }));
        return { success: true, data: items, mock: false };
      }
      return {
        success: true,
        data: [
          { id: `mock_inv_1`, amount: 5000, status: 'paid', created: Math.floor(Date.now() / 1000) - 86400 },
          { id: `mock_inv_2`, amount: 12000, status: 'open', created: Math.floor(Date.now() / 1000) }
        ],
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StripeProvider] listInvoices error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !StripeProvider.isConfigured() };
    }
  }
}

export default new StripeProvider();
