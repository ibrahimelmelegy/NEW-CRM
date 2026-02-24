import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import voipController from './voipController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: VoIP
 *   description: Twilio-powered VoIP calling and webhooks
 */

// ─── VoIP Calling (Twilio) ───────────────────────────────────────────────────

// Initiate a call from the frontend

/**
 * @swagger
 * /api/voip/call:
 *   post:
 *     summary: Initiate an outbound call via Twilio
 *     tags: [VoIP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 description: Phone number to call
 *               contactId:
 *                 type: string
 *                 description: Related CRM contact ID
 *               contactType:
 *                 type: string
 *                 description: Contact type (lead, deal, contact, company)
 *     responses:
 *       200:
 *         description: Call initiated successfully
 *       400:
 *         description: Phone number (to) is required
 */
router.post(
    '/call',
    authenticateUser,
    voipController.initiateCall
);

// Twilio Webhooks (must be public / accessible by Twilio)

/**
 * @swagger
 * /api/voip/twiml:
 *   post:
 *     summary: Twilio TwiML callback (public webhook)
 *     tags: [VoIP]
 *     parameters:
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         description: TwiML message to speak on call connect
 *     responses:
 *       200:
 *         description: TwiML XML response
 *         content:
 *           text/xml:
 *             schema:
 *               type: string
 */
router.post('/twiml', voipController.twimlCallback);

/**
 * @swagger
 * /api/voip/status:
 *   post:
 *     summary: Twilio call status callback (public webhook)
 *     tags: [VoIP]
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         description: CRM contact ID
 *       - in: query
 *         name: contactType
 *         schema:
 *           type: string
 *         description: Contact type (lead, deal, contact, company)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: CRM user ID who initiated the call
 *     requestBody:
 *       required: false
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               CallStatus:
 *                 type: string
 *                 description: Twilio call status (e.g. completed, busy, no-answer, failed)
 *               CallDuration:
 *                 type: string
 *                 description: Call duration in seconds
 *               To:
 *                 type: string
 *                 description: Phone number that was called
 *               RecordingUrl:
 *                 type: string
 *                 description: URL to the call recording
 *     responses:
 *       200:
 *         description: Status processed
 *       500:
 *         description: Error processing status callback
 */
router.post('/status', voipController.statusCallback);

export default router;
