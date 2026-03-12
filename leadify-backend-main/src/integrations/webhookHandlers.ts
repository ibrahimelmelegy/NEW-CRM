// ─── Incoming Webhook Handlers ───────────────────────────────────────────────
// Handles incoming webhooks from Stripe, HubSpot, Twilio, and WhatsApp.
// These endpoints are public (no auth) as they're called by the third-party services.

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import whatsappProvider from './providers/whatsappProvider';
import logger from '../config/logger';

const router = Router();

// ─── Stripe Webhook ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/webhooks/incoming/stripe:
 *   post:
 *     summary: Receive Stripe webhook events
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 */
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if webhook secret is configured
    if (webhookSecret && sig) {
      const payload = JSON.stringify(req.body);
      const expectedSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      // Extract the v1 signature from the Stripe header (format: t=timestamp,v1=sig)
      const sigParts = sig.split(',');
      const v1Part = sigParts.find(p => p.startsWith('v1='));
      const receivedSig = v1Part ? v1Part.slice(3) : sig;

      // Constant-time comparison to prevent timing attacks
      const expectedBuf = Buffer.from(expectedSig, 'utf8');
      const receivedBuf = Buffer.from(receivedSig, 'utf8');
      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        logger.warn('Stripe webhook invalid signature');
        res.status(400).json({ success: false, message: 'Invalid signature' });
        return;
      }
    }

    const event = req.body as StripeWebhookEvent;
    logger.info({ eventType: event.type }, 'Stripe webhook event received');

    switch (event.type) {
      case 'payment_intent.succeeded':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe payment succeeded');
        // Stub: Will update invoice/payment status when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'payment_intent.payment_failed':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe payment failed');
        // Stub: Will notify user of failed payment when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe subscription updated');
        // Stub: Will update subscription status when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'customer.subscription.deleted':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe subscription cancelled');
        // Stub: Will mark subscription as cancelled when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'invoice.paid':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe invoice paid');
        // Stub: Will mark invoice as paid when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'invoice.payment_failed':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe invoice payment failed');
        // Stub: Will send payment failure notification when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      case 'charge.refunded':
        logger.info({ objectId: event.data?.object?.id }, 'Stripe charge refunded');
        // Stub: Will record refund when Stripe integration is fully configured
        logger.warn({ eventType: event.type, objectId: event.data?.object?.id }, '[Webhook] Stripe handler not yet implemented');
        break;

      default:
        logger.info({ eventType: event.type }, 'Stripe unhandled event type');
    }

    res.json({ received: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.error({ err: error }, 'Stripe webhook error');
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── HubSpot Webhook ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/webhooks/incoming/hubspot:
 *   post:
 *     summary: Receive HubSpot webhook events
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/hubspot', async (req: Request, res: Response) => {
  try {
    // HubSpot sends signature in X-HubSpot-Signature-v3
    const signature = req.headers['x-hubspot-signature-v3'] as string;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    if (clientSecret && signature) {
      const payload = JSON.stringify(req.body);
      const expectedSig = crypto.createHmac('sha256', clientSecret).update(payload).digest('base64');

      if (signature !== expectedSig) {
        logger.warn('HubSpot webhook invalid signature');
        res.status(400).json({ success: false, message: 'Invalid signature' });
        return;
      }
    }

    const events = req.body as HubSpotWebhookEvent[];
    logger.info({ eventCount: Array.isArray(events) ? events.length : 0 }, 'HubSpot webhook events received');

    if (Array.isArray(events)) {
      for (const event of events) {
        switch (event.subscriptionType) {
          case 'contact.creation':
            logger.info({ objectId: event.objectId }, 'HubSpot contact created');
            // Stub: Will sync new HubSpot contact to CRM leads when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'contact.propertyChange':
            logger.info({ objectId: event.objectId, propertyName: event.propertyName }, 'HubSpot contact updated');
            // Stub: Will sync contact property changes when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'contact.deletion':
            logger.info({ objectId: event.objectId }, 'HubSpot contact deleted');
            // Stub: Will handle contact deletion when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'deal.creation':
            logger.info({ objectId: event.objectId }, 'HubSpot deal created');
            // Stub: Will sync new HubSpot deal to CRM deals when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'deal.propertyChange':
            logger.info({ objectId: event.objectId, propertyName: event.propertyName }, 'HubSpot deal updated');
            // Stub: Will sync deal property changes when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'deal.deletion':
            logger.info({ objectId: event.objectId }, 'HubSpot deal deleted');
            // Stub: Will handle deal deletion when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          case 'company.creation':
            logger.info({ objectId: event.objectId }, 'HubSpot company created');
            // Stub: Will sync new company to CRM clients when HubSpot integration is fully configured
            logger.warn({ subscriptionType: event.subscriptionType, objectId: event.objectId }, '[Webhook] HubSpot handler not yet implemented');
            break;

          default:
            logger.info({ subscriptionType: event.subscriptionType }, 'HubSpot unhandled event type');
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.error({ err: error }, 'HubSpot webhook error');
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── Twilio Webhook ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/webhooks/incoming/twilio/sms:
 *   post:
 *     summary: Receive Twilio SMS status callbacks and incoming messages
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/twilio/sms', async (req: Request, res: Response) => {
  try {
    const body = req.body as TwilioSMSWebhookPayload;
    logger.info({ from: body.From || 'unknown', status: body.SmsStatus || body.MessageStatus || 'unknown' }, 'Twilio SMS event received');

    if (body.Body) {
      // Incoming SMS message
      logger.info({ from: body.From, body: body.Body }, 'Twilio incoming SMS');
      // Stub: Will create a new message record in CRM messaging when Twilio integration is fully configured
      logger.warn({ from: body.From, messageSid: body.MessageSid }, '[Webhook] Twilio SMS inbound handler not yet implemented');
    } else if (body.MessageStatus) {
      // Status callback
      logger.info({ messageSid: body.MessageSid, status: body.MessageStatus }, 'Twilio message status update');
      // Stub: Will update message delivery status when Twilio integration is fully configured
      logger.warn({ messageSid: body.MessageSid, status: body.MessageStatus }, '[Webhook] Twilio SMS status handler not yet implemented');
    }

    // Twilio expects TwiML response for incoming SMS
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.error({ err: error }, 'Twilio SMS webhook error');
    res.status(500).json({ success: false, message: errMsg });
  }
});

/**
 * @swagger
 * /api/webhooks/incoming/twilio/voice:
 *   post:
 *     summary: Receive Twilio voice call status callbacks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/twilio/voice', async (req: Request, res: Response) => {
  try {
    const body = req.body as TwilioVoiceWebhookPayload;
    logger.info({ callSid: body.CallSid, callStatus: body.CallStatus }, 'Twilio voice call status update');

    // Stub: Will update call log and record duration/status when Twilio voice integration is fully configured
    logger.warn({ callSid: body.CallSid, callStatus: body.CallStatus }, '[Webhook] Twilio voice handler not yet implemented');

    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.error({ err: error }, 'Twilio voice webhook error');
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── WhatsApp Webhook ───────────────────────────────────────────────────────
/**
 * @swagger
 * /api/webhooks/incoming/whatsapp:
 *   get:
 *     summary: WhatsApp webhook verification (Meta challenge)
 *     tags: [Webhooks]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge accepted
 *       403:
 *         description: Verification failed
 */
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = whatsappProvider.verifyWebhook(mode, token, challenge);
  if (result !== null) {
    logger.info('WhatsApp webhook verification successful');
    res.status(200).send(result);
  } else {
    logger.warn('WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

/**
 * @swagger
 * /api/webhooks/incoming/whatsapp:
 *   post:
 *     summary: Receive WhatsApp message and status webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const events = whatsappProvider.parseWebhookPayload(req.body);
    logger.info({ eventCount: events.length }, 'WhatsApp webhook events received');

    for (const event of events) {
      if (event.type === 'message') {
        logger.info({ from: event.from, text: event.text || '(media)' }, 'WhatsApp incoming message');
        // Stub: Will create incoming message record in CRM messaging when WhatsApp integration is fully configured
        logger.warn({ from: event.from }, '[Webhook] WhatsApp inbound message handler not yet implemented');
      } else if (event.type === 'status') {
        logger.info({ messageId: event.messageId, status: event.text }, 'WhatsApp message status update');
        // Stub: Will update message delivery status when WhatsApp integration is fully configured
        logger.warn({ messageId: event.messageId, status: event.text }, '[Webhook] WhatsApp status handler not yet implemented');
      }
    }

    res.json({ received: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed';
    logger.error({ err: error }, 'WhatsApp webhook error');
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      [key: string]: unknown;
    };
  };
}

interface HubSpotWebhookEvent {
  objectId: number;
  subscriptionType: string;
  propertyName?: string;
  propertyValue?: string;
  changeSource?: string;
  eventId?: number;
  occurredAt?: number;
}

interface TwilioSMSWebhookPayload {
  MessageSid?: string;
  SmsSid?: string;
  AccountSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  SmsStatus?: string;
  MessageStatus?: string;
  NumMedia?: string;
}

interface TwilioVoiceWebhookPayload {
  CallSid: string;
  AccountSid?: string;
  From?: string;
  To?: string;
  CallStatus: string;
  CallDuration?: string;
  Direction?: string;
}

export default router;
