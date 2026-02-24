import crypto from 'crypto';
import Webhook from './webhookModel';

class WebhookService {
  async getAll() {
    return Webhook.findAll({ order: [['createdAt', 'DESC']] });
  }

  async create(data: any) {
    if (!data.secret) {
      data.secret = crypto.randomBytes(32).toString('hex');
    }
    return Webhook.create(data);
  }

  async update(id: string, data: any) {
    const webhook = await Webhook.findByPk(id);
    if (!webhook) throw new Error('Webhook not found');
    return webhook.update(data);
  }

  async delete(id: string) {
    const webhook = await Webhook.findByPk(id);
    if (!webhook) throw new Error('Webhook not found');
    await webhook.destroy();
  }

  async fire(eventName: string, payload: any) {
    const webhooks = await Webhook.findAll({
      where: { isActive: true }
    });

    const matching = webhooks.filter(w => w.events.includes(eventName));

    for (const webhook of matching) {
      this.deliver(webhook, eventName, payload).catch(() => {
        // Silently handle — failure count is updated in deliver
      });
    }
  }

  private async deliver(webhook: Webhook, event: string, payload: any, attempt: number = 1) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        },
        body,
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await webhook.update({
        lastTriggered: new Date(),
        failureCount: 0
      });
    } catch {
      const newCount = webhook.failureCount + 1;
      await webhook.update({ failureCount: newCount });

      // Retry up to 3 times with exponential backoff
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => this.deliver(webhook, event, payload, attempt + 1), delay);
      } else if (newCount >= 10) {
        // Auto-disable after 10 consecutive failures
        await webhook.update({ isActive: false });
      }
    }
  }

  async test(id: string) {
    const webhook = await Webhook.findByPk(id);
    if (!webhook) throw new Error('Webhook not found');

    const testPayload = { test: true, message: 'Webhook test from High Point Technology CRM' };
    const body = JSON.stringify({ event: 'test', payload: testPayload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test'
      },
      body,
      signal: AbortSignal.timeout(10000)
    });

    return { status: response.status, ok: response.ok };
  }
}

export default new WebhookService();
