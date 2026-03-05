import twilio from 'twilio';

class TwilioService {
  private client: twilio.Twilio | null = null;
  private twilioPhoneNumber: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || null;

    if (accountSid && authToken && this.twilioPhoneNumber) {
      this.client = twilio(accountSid, authToken);
    } else {
      console.warn('[TwilioService] Twilio credentials are not fully configured in environment variables.');
    }
  }

  /**
   * Make a VoIP call
   * @param to Phone number to call
   * @param twimlUrl The URL Twilio will request when the call connects to get TwiML instructions
   * @param webhookUrl The URL Twilio will send call status updates to
   */
  public async makeCall(to: string, twimlUrl: string, webhookUrl?: string): Promise<any> {
    if (!this.client || !this.twilioPhoneNumber) {
      throw new Error('Twilio integration is not fully configured.');
    }

    try {
      const call = await this.client.calls.create({
        url: twimlUrl,
        to: to,
        from: this.twilioPhoneNumber,
        statusCallback: webhookUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });
      return call;
    } catch (error) {
      console.error('[TwilioService] Failed to make call:', error);
      throw error;
    }
  }

  /**
   * Generates simple TwiML for an outbound call message
   */
  public generateTwiML(message: string): string {
    const response = new twilio.twiml.VoiceResponse();
    response.say(message);
    return response.toString();
  }
}

export default new TwilioService();
