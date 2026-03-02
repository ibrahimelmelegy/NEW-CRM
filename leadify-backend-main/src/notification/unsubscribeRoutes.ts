import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import NotificationPreference, { DEFAULT_NOTIFICATION_PREFERENCES } from './notificationPreferenceModel';

const router = express.Router();

interface UnsubscribePayload {
  userId: number;
  notificationType: string;
}

/**
 * Public endpoint — no auth required.
 * GET /api/notifications/unsubscribe?token=xxx
 * Disables email channel for the given notification type for the user.
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('<h2>Invalid unsubscribe link.</h2>');
    }

    const secret = process.env.SECRET_KEY;
    if (!secret) {
      return res.status(500).send('<h2>Server configuration error.</h2>');
    }
    let payload: UnsubscribePayload;
    try {
      payload = jwt.verify(token, secret) as UnsubscribePayload;
    } catch {
      return res.status(400).send('<h2>This unsubscribe link has expired or is invalid.</h2>');
    }

    const { userId, notificationType } = payload;

    let pref = await NotificationPreference.findOne({ where: { userId } });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES }
      });
    }

    const prefs = { ...pref.preferences };
    if (prefs[notificationType]) {
      prefs[notificationType] = { ...prefs[notificationType], email: false };
    } else {
      prefs[notificationType] = { inApp: true, email: false, push: false };
    }

    await pref.update({ preferences: prefs });

    res.status(200).send(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px;">' +
      '<h2>Successfully unsubscribed</h2>' +
      `<p>You will no longer receive email notifications for <strong>${notificationType.replace(/_/g, ' ').toLowerCase()}</strong>.</p>` +
      '<p>You can re-enable email notifications from your CRM settings at any time.</p>' +
      '</body></html>'
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('<h2>Something went wrong. Please try again later.</h2>');
  }
});

export default router;
