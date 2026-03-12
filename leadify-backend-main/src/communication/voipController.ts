import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import twilioService from '../integration/twilioService';
import communicationService from './communicationService';
import { AuthenticatedRequest } from '../types';
import logger from '../config/logger';

class VoipController {
  /**
   * Initiate an outbound call from the CRM
   */
  public async initiateCall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to, contactId, contactType } = req.body;
      const user = req.user;

      if (!to) {
        res.status(400).json({ message: 'Phone number (to) is required.' });
        return;
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      // Create a temporary TwiML endpoint for this specific call or a generic one
      const twimlUrl = `${baseUrl}/api/voip/twiml?message=Connecting+you+now`;
      const webhookUrl = `${baseUrl}/api/voip/status?contactId=${contactId || ''}&contactType=${contactType || ''}&userId=${user?.id || ''}`;

      const call = await twilioService.makeCall(to, twimlUrl, webhookUrl);

      wrapResult(res, {
        message: 'Call initiated successfully.',
        callSid: call.sid,
        status: call.status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook endpoint for Twilio to fetch TwiML instructions when a call connects
   */
  public twimlCallback(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const message = (req.query.message as string) || 'Welcome to the CRM call.';
      const twiml = twilioService.generateTwiML(message);

      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook endpoint for Twilio call status updates
   */
  public async statusCallback(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { CallStatus, CallDuration, To, RecordingUrl } = req.body;
      const { contactId, contactType, userId } = req.query;

      // Log completed calls into the CRM timeline
      if (CallStatus === 'completed' && contactId && contactType && userId) {
        await communicationService.logCall(
          {
            contactId: contactId as string,
            contactType: contactType as string,
            subject: 'Outbound Call via Twilio',
            phoneNumber: To,
            duration: parseInt(CallDuration || '0', 10),
            outcome: 'ANSWERED',
            recordingUrl: RecordingUrl,
            direction: 'OUTBOUND'
          },
          parseInt(userId as string, 10)
        );
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error({ error }, '[VoIP] Error in status callback');
      res.status(500).send('Error');
    }
  }
}

export default new VoipController();
