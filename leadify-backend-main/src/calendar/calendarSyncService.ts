import CalendarSync from './calendarSyncModel';
import CalendarEvent from './calendarEventModel';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../config/logger';

// ─── Configuration ──────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || '';

const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CALENDAR_CLIENT_ID || '';
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CALENDAR_CLIENT_SECRET || '';
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_CALENDAR_REDIRECT_URI || '';

function isGoogleConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

function isOutlookConfigured(): boolean {
  return !!(OUTLOOK_CLIENT_ID && OUTLOOK_CLIENT_SECRET && OUTLOOK_REDIRECT_URI);
}

// ─── Type Definitions ───────────────────────────────────────────────────────
interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

class CalendarSyncService {
  // ─── Get Sync Status ──────────────────────────────────────────────────────
  async getSyncStatus(userId: number) {
    const syncs = await CalendarSync.findAll({ where: { userId } });
    const googleSync = syncs.find(s => s.provider === 'google');
    const outlookSync = syncs.find(s => s.provider === 'outlook');

    return {
      google: googleSync
        ? {
            connected: googleSync.isActive && googleSync.syncStatus === 'connected',
            email: googleSync.email,
            lastSyncAt: googleSync.lastSyncAt,
            syncStatus: googleSync.syncStatus,
            autoSync: googleSync.autoSync,
            syncedEventsCount: googleSync.syncedEventsCount,
            lastError: googleSync.lastError
          }
        : { connected: false, email: null, lastSyncAt: null, syncStatus: 'disconnected', autoSync: false, syncedEventsCount: 0, lastError: null },
      outlook: outlookSync
        ? {
            connected: outlookSync.isActive && outlookSync.syncStatus === 'connected',
            email: outlookSync.email,
            lastSyncAt: outlookSync.lastSyncAt,
            syncStatus: outlookSync.syncStatus,
            autoSync: outlookSync.autoSync,
            syncedEventsCount: outlookSync.syncedEventsCount,
            lastError: outlookSync.lastError
          }
        : { connected: false, email: null, lastSyncAt: null, syncStatus: 'disconnected', autoSync: false, syncedEventsCount: 0, lastError: null },
      googleConfigured: isGoogleConfigured(),
      outlookConfigured: isOutlookConfigured()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Initiate Google OAuth ────────────────────────────────────────────────
  async initiateGoogleAuth(userId: number): Promise<{ url: string; mock?: boolean }> {
    if (!isGoogleConfigured()) {
      // Return a mock flow URL that redirects back with a fake code
      const mockUrl = `${GOOGLE_REDIRECT_URI || '/api/calendar/sync/google/callback'}?code=mock_google_code_${userId}&state=${userId}&mock=true`;
      return { url: mockUrl, mock: true };
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: String(userId)
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  // ─── Handle Google OAuth Callback ─────────────────────────────────────────
  async handleGoogleCallback(userId: number, code: string): Promise<CalendarSync> {
    if (!isGoogleConfigured() || code.startsWith('mock_google_code_')) {
      return this.createMockSync(userId, 'google');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      error?: string;
    };

    if (tokens.error) {
      throw new Error(`Google OAuth error: ${tokens.error}`);
    }

    // Get user email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = (await userInfoRes.json()) as { email: string };

    // Upsert sync record
    const [sync] = await CalendarSync.upsert({
      userId,
      provider: 'google',
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      email: userInfo.email,
      calendarId: 'primary',
      isActive: true,
      autoSync: true,
      syncStatus: 'connected',
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      lastError: null
    });

    return sync;
  }

  // ─── Refresh Google Token ─────────────────────────────────────────────────
  private async refreshGoogleToken(sync: CalendarSync): Promise<string> {
    if (!sync.refreshToken || !isGoogleConfigured()) {
      throw new Error('No refresh token available');
    }

    const refreshToken = decrypt(sync.refreshToken);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    const tokens = (await response.json()) as { access_token: string; expires_in: number; error?: string };
    if (tokens.error) {
      await sync.update({ syncStatus: 'error', lastError: `Token refresh failed: ${tokens.error}` });
      throw new Error(`Token refresh failed: ${tokens.error}`);
    }

    await sync.update({
      accessToken: encrypt(tokens.access_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    });

    return tokens.access_token;
  }

  // ─── Sync From Google ─────────────────────────────────────────────────────
  async syncFromGoogle(userId: number): Promise<SyncResult> {
    const sync = await CalendarSync.findOne({ where: { userId, provider: 'google', isActive: true } });
    if (!sync) throw new Error('Google Calendar not connected');

    if (!isGoogleConfigured()) {
      return this.mockSyncFromProvider(userId, 'google');
    }

    await sync.update({ syncStatus: 'syncing' });

    try {
      let accessToken = decrypt(sync.accessToken!);

      // Check if token needs refresh
      if (sync.tokenExpiresAt && new Date(sync.tokenExpiresAt) <= new Date()) {
        accessToken = await this.refreshGoogleToken(sync);
      }

      // Fetch events from Google Calendar
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);

      const url =
        `https://www.googleapis.com/calendar/v3/calendars/${sync.calendarId || 'primary'}/events?` +
        new URLSearchParams({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '250'
        });

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const data = (await response.json()) as {
        items?: Array<{
          id: string;
          summary?: string;
          description?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          location?: string;
          hangoutLink?: string;
          attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
          status?: string;
        }>;
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(data.error.message);
      }

      const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };
      const googleEvents = data.items || [];

      for (const gEvent of googleEvents) {
        try {
          const isAllDay = !gEvent.start?.dateTime;
          const startDate = gEvent.start?.dateTime || gEvent.start?.date || '';
          const endDate = gEvent.end?.dateTime || gEvent.end?.date || '';

          const eventData = {
            title: gEvent.summary || 'Untitled',
            description: gEvent.description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            allDay: isAllDay,
            location: gEvent.location,
            meetingLink: gEvent.hangoutLink,
            attendees: (gEvent.attendees || []).map(a => ({
              name: a.displayName || a.email,
              email: a.email,
              status: a.responseStatus === 'accepted' ? 'ACCEPTED' : a.responseStatus === 'declined' ? 'DECLINED' : 'PENDING'
            })),
            status: gEvent.status === 'cancelled' ? 'CANCELLED' : 'SCHEDULED',
            externalId: gEvent.id,
            externalProvider: 'google' as const,
            lastSyncedAt: new Date(),
            userId,
            eventType: 'MEETING'
          };

          // Check if event already exists
          const existing = await CalendarEvent.findOne({
            where: { externalId: gEvent.id, externalProvider: 'google', userId }
          });

          if (existing) {
            await existing.update(eventData);
            result.updated++;
          } else {
            await CalendarEvent.create(eventData);
            result.created++;
          }
        } catch (err) {
          result.errors.push(`Failed to sync event ${gEvent.id}: ${(err as Error).message}`);
        }
      }

      await sync.update({
        lastSyncAt: new Date(),
        syncStatus: 'connected',
        syncedEventsCount: result.created + result.updated,
        lastError: result.errors.length > 0 ? result.errors.join('; ') : null
      });

      return result;
    } catch (error) {
      await sync.update({
        syncStatus: 'error',
        lastError: (error as Error).message
      });
      throw error;
    }
  }

  // ─── Push Event to Google ─────────────────────────────────────────────────
  async pushToGoogle(userId: number, eventId: number): Promise<{ externalId: string }> {
    const sync = await CalendarSync.findOne({ where: { userId, provider: 'google', isActive: true } });
    if (!sync) throw new Error('Google Calendar not connected');

    const event = await CalendarEvent.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if (!isGoogleConfigured()) {
      const mockExternalId = `mock_google_${event.id}_${Date.now()}`;
      await event.update({ externalId: mockExternalId, externalProvider: 'google', lastSyncedAt: new Date() });
      return { externalId: mockExternalId };
    }

    let accessToken = decrypt(sync.accessToken!);
    if (sync.tokenExpiresAt && new Date(sync.tokenExpiresAt) <= new Date()) {
      accessToken = await this.refreshGoogleToken(sync);
    }

    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: event.allDay ? { date: event.startDate.toISOString().split('T')[0] } : { dateTime: event.startDate.toISOString() },
      end: event.allDay ? { date: event.endDate.toISOString().split('T')[0] } : { dateTime: event.endDate.toISOString() },
      location: event.location,
      attendees: (event.attendees || []).map(a => ({ email: a.email, displayName: a.name }))
    };

    const calendarId = sync.calendarId || 'primary';
    let url: string;
    let method: string;

    if (event.externalId && event.externalProvider === 'google') {
      // Update existing Google event
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.externalId}`;
      method = 'PUT';
    } else {
      // Create new Google event
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
      method = 'POST';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    const result = (await response.json()) as { id: string; error?: { message: string } };

    if (result.error) {
      throw new Error(`Google Calendar API error: ${result.error.message}`);
    }

    await event.update({ externalId: result.id, externalProvider: 'google', lastSyncedAt: new Date() });

    return { externalId: result.id };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTLOOK CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Initiate Outlook OAuth ───────────────────────────────────────────────
  async initiateOutlookAuth(userId: number): Promise<{ url: string; mock?: boolean }> {
    if (!isOutlookConfigured()) {
      const mockUrl = `${OUTLOOK_REDIRECT_URI || '/api/calendar/sync/outlook/callback'}?code=mock_outlook_code_${userId}&state=${userId}&mock=true`;
      return { url: mockUrl, mock: true };
    }

    const scopes = ['openid', 'profile', 'email', 'Calendars.ReadWrite', 'offline_access'];

    const params = new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      redirect_uri: OUTLOOK_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      response_mode: 'query',
      state: String(userId)
    });

    return { url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}` };
  }

  // ─── Handle Outlook OAuth Callback ────────────────────────────────────────
  async handleOutlookCallback(userId: number, code: string): Promise<CalendarSync> {
    if (!isOutlookConfigured() || code.startsWith('mock_outlook_code_')) {
      return this.createMockSync(userId, 'outlook');
    }

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        redirect_uri: OUTLOOK_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'Calendars.ReadWrite offline_access email profile openid'
      })
    });

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      error?: string;
    };

    if (tokens.error) {
      throw new Error(`Outlook OAuth error: ${tokens.error}`);
    }

    // Get user profile
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = (await profileRes.json()) as { mail?: string; userPrincipalName?: string };

    const [sync] = await CalendarSync.upsert({
      userId,
      provider: 'outlook',
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      email: profile.mail || profile.userPrincipalName || '',
      calendarId: 'default',
      isActive: true,
      autoSync: true,
      syncStatus: 'connected',
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      lastError: null
    });

    return sync;
  }

  // ─── Refresh Outlook Token ────────────────────────────────────────────────
  private async refreshOutlookToken(sync: CalendarSync): Promise<string> {
    if (!sync.refreshToken || !isOutlookConfigured()) {
      throw new Error('No refresh token available');
    }

    const refreshToken = decrypt(sync.refreshToken);
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        scope: 'Calendars.ReadWrite offline_access email profile openid'
      })
    });

    const tokens = (await response.json()) as { access_token: string; expires_in: number; refresh_token?: string; error?: string };
    if (tokens.error) {
      await sync.update({ syncStatus: 'error', lastError: `Token refresh failed: ${tokens.error}` });
      throw new Error(`Token refresh failed: ${tokens.error}`);
    }

    await sync.update({
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : sync.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    });

    return tokens.access_token;
  }

  // ─── Sync From Outlook ────────────────────────────────────────────────────
  async syncFromOutlook(userId: number): Promise<SyncResult> {
    const sync = await CalendarSync.findOne({ where: { userId, provider: 'outlook', isActive: true } });
    if (!sync) throw new Error('Outlook Calendar not connected');

    if (!isOutlookConfigured()) {
      return this.mockSyncFromProvider(userId, 'outlook');
    }

    await sync.update({ syncStatus: 'syncing' });

    try {
      let accessToken = decrypt(sync.accessToken!);

      if (sync.tokenExpiresAt && new Date(sync.tokenExpiresAt) <= new Date()) {
        accessToken = await this.refreshOutlookToken(sync);
      }

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const url =
        `https://graph.microsoft.com/v1.0/me/calendarview?` +
        new URLSearchParams({
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          $top: '250',
          $orderby: 'start/dateTime'
        });

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const data = (await response.json()) as {
        value?: Array<{
          id: string;
          subject?: string;
          bodyPreview?: string;
          start?: { dateTime: string; timeZone: string };
          end?: { dateTime: string; timeZone: string };
          isAllDay?: boolean;
          location?: { displayName?: string };
          onlineMeeting?: { joinUrl?: string };
          attendees?: Array<{ emailAddress: { name?: string; address: string }; status?: { response?: string } }>;
          isCancelled?: boolean;
        }>;
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(data.error.message);
      }

      const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };
      const outlookEvents = data.value || [];

      for (const oEvent of outlookEvents) {
        try {
          const eventData = {
            title: oEvent.subject || 'Untitled',
            description: oEvent.bodyPreview,
            startDate: new Date(oEvent.start?.dateTime || ''),
            endDate: new Date(oEvent.end?.dateTime || ''),
            allDay: oEvent.isAllDay || false,
            location: oEvent.location?.displayName,
            meetingLink: oEvent.onlineMeeting?.joinUrl,
            attendees: (oEvent.attendees || []).map(a => ({
              name: a.emailAddress.name || a.emailAddress.address,
              email: a.emailAddress.address,
              status: a.status?.response === 'accepted' ? 'ACCEPTED' : a.status?.response === 'declined' ? 'DECLINED' : 'PENDING'
            })),
            status: oEvent.isCancelled ? 'CANCELLED' : 'SCHEDULED',
            externalId: oEvent.id,
            externalProvider: 'outlook' as const,
            lastSyncedAt: new Date(),
            userId,
            eventType: 'MEETING'
          };

          const existing = await CalendarEvent.findOne({
            where: { externalId: oEvent.id, externalProvider: 'outlook', userId }
          });

          if (existing) {
            await existing.update(eventData);
            result.updated++;
          } else {
            await CalendarEvent.create(eventData);
            result.created++;
          }
        } catch (err) {
          result.errors.push(`Failed to sync event ${oEvent.id}: ${(err as Error).message}`);
        }
      }

      await sync.update({
        lastSyncAt: new Date(),
        syncStatus: 'connected',
        syncedEventsCount: result.created + result.updated,
        lastError: result.errors.length > 0 ? result.errors.join('; ') : null
      });

      return result;
    } catch (error) {
      await sync.update({ syncStatus: 'error', lastError: (error as Error).message });
      throw error;
    }
  }

  // ─── Push Event to Outlook ────────────────────────────────────────────────
  async pushToOutlook(userId: number, eventId: number): Promise<{ externalId: string }> {
    const sync = await CalendarSync.findOne({ where: { userId, provider: 'outlook', isActive: true } });
    if (!sync) throw new Error('Outlook Calendar not connected');

    const event = await CalendarEvent.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if (!isOutlookConfigured()) {
      const mockExternalId = `mock_outlook_${event.id}_${Date.now()}`;
      await event.update({ externalId: mockExternalId, externalProvider: 'outlook', lastSyncedAt: new Date() });
      return { externalId: mockExternalId };
    }

    let accessToken = decrypt(sync.accessToken!);
    if (sync.tokenExpiresAt && new Date(sync.tokenExpiresAt) <= new Date()) {
      accessToken = await this.refreshOutlookToken(sync);
    }

    const outlookEvent = {
      subject: event.title,
      body: { contentType: 'text', content: event.description || '' },
      start: { dateTime: event.startDate.toISOString(), timeZone: 'UTC' },
      end: { dateTime: event.endDate.toISOString(), timeZone: 'UTC' },
      isAllDay: event.allDay,
      location: event.location ? { displayName: event.location } : undefined,
      attendees: (event.attendees || []).map(a => ({
        emailAddress: { address: a.email, name: a.name },
        type: 'required'
      }))
    };

    let url: string;
    let method: string;

    if (event.externalId && event.externalProvider === 'outlook') {
      url = `https://graph.microsoft.com/v1.0/me/events/${event.externalId}`;
      method = 'PATCH';
    } else {
      url = 'https://graph.microsoft.com/v1.0/me/events';
      method = 'POST';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outlookEvent)
    });

    const result = (await response.json()) as { id: string; error?: { message: string } };

    if (result.error) {
      throw new Error(`Outlook Calendar API error: ${result.error.message}`);
    }

    await event.update({ externalId: result.id, externalProvider: 'outlook', lastSyncedAt: new Date() });

    return { externalId: result.id };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC SYNC OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Sync All Connected Providers ─────────────────────────────────────────
  async syncAll(userId: number): Promise<{ google?: SyncResult; outlook?: SyncResult }> {
    const results: { google?: SyncResult; outlook?: SyncResult } = {};

    const syncs = await CalendarSync.findAll({ where: { userId, isActive: true } });

    for (const sync of syncs) {
      try {
        if (sync.provider === 'google') {
          results.google = await this.syncFromGoogle(userId);
        } else if (sync.provider === 'outlook') {
          results.outlook = await this.syncFromOutlook(userId);
        }
      } catch (error) {
        // Individual sync errors shouldn't block others
        logger.error({ err: (error as Error).message }, `Sync error for ${sync.provider}`);
      }
    }

    return results;
  }

  // ─── Disconnect Provider ──────────────────────────────────────────────────
  async disconnectProvider(userId: number, provider: 'google' | 'outlook'): Promise<void> {
    const sync = await CalendarSync.findOne({ where: { userId, provider } });
    if (sync) {
      await sync.update({
        isActive: false,
        syncStatus: 'disconnected',
        accessToken: null,
        refreshToken: null
      });
    }

    // Optionally remove external IDs from synced events (keep events, remove link)
    await CalendarEvent.update({ externalId: null, externalProvider: null, lastSyncedAt: null }, { where: { userId, externalProvider: provider } });
  }

  // ─── Toggle Auto-Sync ────────────────────────────────────────────────────
  async toggleAutoSync(userId: number, provider: 'google' | 'outlook', enabled: boolean): Promise<CalendarSync | null> {
    const sync = await CalendarSync.findOne({ where: { userId, provider } });
    if (!sync) return null;
    await sync.update({ autoSync: enabled });
    return sync;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOCK IMPLEMENTATIONS (for when API keys are not configured)
  // ═══════════════════════════════════════════════════════════════════════════

  private async createMockSync(userId: number, provider: 'google' | 'outlook'): Promise<CalendarSync> {
    const mockEmail = provider === 'google' ? `user${userId}@gmail.com` : `user${userId}@outlook.com`;

    const [sync] = await CalendarSync.upsert({
      userId,
      provider,
      accessToken: encrypt('mock_access_token_' + Date.now()),
      refreshToken: encrypt('mock_refresh_token_' + Date.now()),
      email: mockEmail,
      calendarId: provider === 'google' ? 'primary' : 'default',
      isActive: true,
      autoSync: false,
      syncStatus: 'connected',
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      lastError: null,
      lastSyncAt: new Date()
    });

    // Create some mock synced events
    await this.createMockEvents(userId, provider);

    return sync;
  }

  private async createMockEvents(userId: number, provider: 'google' | 'outlook'): Promise<void> {
    const now = new Date();
    const mockEvents = [
      {
        title: provider === 'google' ? 'Google Meet: Sprint Planning' : 'Teams: Sprint Planning',
        description: 'Weekly sprint planning session synced from external calendar',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0),
        allDay: false,
        eventType: 'MEETING',
        meetingLink: provider === 'google' ? 'https://meet.google.com/abc-defg-hij' : 'https://teams.microsoft.com/l/meetup-join/abc',
        externalId: `mock_${provider}_sprint_${Date.now()}`,
        externalProvider: provider,
        lastSyncedAt: now,
        userId,
        status: 'SCHEDULED',
        priority: 'HIGH',
        attendees: [
          { name: 'John Smith', email: 'john@example.com', status: 'ACCEPTED' },
          { name: 'Sarah Wilson', email: 'sarah@example.com', status: 'PENDING' }
        ]
      },
      {
        title: provider === 'google' ? 'Client Review Call' : 'Project Sync',
        description: 'Quarterly review synced from external calendar',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 15, 30),
        allDay: false,
        eventType: 'CALL',
        externalId: `mock_${provider}_review_${Date.now()}`,
        externalProvider: provider,
        lastSyncedAt: now,
        userId,
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        attendees: [{ name: 'Alex Johnson', email: 'alex@client.com', status: 'ACCEPTED' }]
      },
      {
        title: provider === 'google' ? 'Team Building Event' : 'Company All-Hands',
        description: 'Full-day event synced from external calendar',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59),
        allDay: true,
        eventType: 'OTHER',
        externalId: `mock_${provider}_team_${Date.now()}`,
        externalProvider: provider,
        lastSyncedAt: now,
        userId,
        status: 'SCHEDULED',
        priority: 'LOW'
      }
    ];

    for (const evt of mockEvents) {
      await CalendarEvent.create(evt);
    }
  }

  private async mockSyncFromProvider(userId: number, provider: 'google' | 'outlook'): Promise<SyncResult> {
    const sync = await CalendarSync.findOne({ where: { userId, provider } });

    // Simulate syncing by updating timestamps
    if (sync) {
      await sync.update({
        lastSyncAt: new Date(),
        syncStatus: 'connected',
        lastError: null
      });
    }

    // Count existing synced events
    const existingCount = await CalendarEvent.count({
      where: { userId, externalProvider: provider }
    });

    return {
      created: 0,
      updated: existingCount,
      deleted: 0,
      errors: []
    };
  }
}

export default new CalendarSyncService();
