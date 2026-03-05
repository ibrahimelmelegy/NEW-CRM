// ─── Twilio SMS Service Provider ─────────────────────────────────────────────
// Uses real Twilio SDK when TWILIO_AUTH_TOKEN is set, otherwise returns mock data.
// Note: The existing TwilioService in src/integration/twilioService.ts handles VoIP calls.
// This provider focuses on SMS messaging capabilities.

export interface SMSInput {
  to: string;
  body: string;
  from?: string;
}

export interface BulkSMSInput {
  recipients: string[];
  body: string;
  from?: string;
}

export interface SMSResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class TwilioProvider {
  private client: any = null;

  static isConfigured(): boolean {
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  }

  private getClient() {
    if (!this.client && TwilioProvider.isConfigured()) {
      try {
        const twilio = require('twilio');
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      } catch (err) {
        console.error('[TwilioProvider] Failed to initialize Twilio SDK:', err);
      }
    }
    return this.client;
  }

  private getDefaultFrom(): string {
    return process.env.TWILIO_PHONE_NUMBER || '+15005550006';
  }

  async sendSMS(input: SMSInput): Promise<SMSResult<{ sid: string; status: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const message = await client.messages.create({
          to: input.to,
          from: input.from || this.getDefaultFrom(),
          body: input.body,
        });
        return { success: true, data: { sid: message.sid, status: message.status }, mock: false };
      }
      return { success: true, data: { sid: `mock_sms_${Date.now()}`, status: 'queued' }, mock: true };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TwilioProvider] sendSMS error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !TwilioProvider.isConfigured() };
    }
  }

  async sendBulkSMS(input: BulkSMSInput): Promise<SMSResult<{ sent: number; results: Array<{ to: string; sid: string; status: string }> }>> {
    try {
      const client = this.getClient();
      if (client) {
        const results = await Promise.allSettled(
          input.recipients.map(to =>
            client.messages.create({ to, from: input.from || this.getDefaultFrom(), body: input.body })
          )
        );
        const items = results.map((r, i) =>
          r.status === 'fulfilled'
            ? { to: input.recipients[i], sid: r.value.sid, status: r.value.status }
            : { to: input.recipients[i], sid: '', status: 'failed' }
        );
        return { success: true, data: { sent: items.filter(i => i.status !== 'failed').length, results: items }, mock: false };
      }
      const items = input.recipients.map((to, i) => ({ to, sid: `mock_bulk_sms_${Date.now()}_${i}`, status: 'queued' }));
      return { success: true, data: { sent: items.length, results: items }, mock: true };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TwilioProvider] sendBulkSMS error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !TwilioProvider.isConfigured() };
    }
  }

  async getMessageStatus(messageSid: string): Promise<SMSResult<{ sid: string; status: string; to: string; dateSent: string | null }>> {
    try {
      const client = this.getClient();
      if (client) {
        const msg = await client.messages(messageSid).fetch();
        return { success: true, data: { sid: msg.sid, status: msg.status, to: msg.to, dateSent: msg.dateSent?.toISOString() || null }, mock: false };
      }
      return { success: true, data: { sid: messageSid, status: 'delivered', to: '+1234567890', dateSent: new Date().toISOString() }, mock: true };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TwilioProvider] getMessageStatus error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !TwilioProvider.isConfigured() };
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<SMSResult<{ valid: boolean; countryCode: string; phoneNumber: string; carrier: string | null }>> {
    try {
      const client = this.getClient();
      if (client) {
        const lookup = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({ fields: 'line_type_intelligence' });
        return {
          success: true,
          data: {
            valid: lookup.valid,
            countryCode: lookup.countryCode,
            phoneNumber: lookup.phoneNumber,
            carrier: lookup.lineTypeIntelligence?.carrier_name || null,
          },
          mock: false,
        };
      }
      const isValid = /^\+\d{10,15}$/.test(phoneNumber);
      return { success: true, data: { valid: isValid, countryCode: 'US', phoneNumber, carrier: null }, mock: true };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TwilioProvider] validatePhoneNumber error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !TwilioProvider.isConfigured() };
    }
  }
}

export default new TwilioProvider();
