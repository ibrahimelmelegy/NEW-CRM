import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import Integration from './integrationModel';

class CalendarService {
    // 1. Google Calendar Integration
    async getGoogleAuthUrl(clientId: string, clientSecret: string, redirectUri: string) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events']
        });
    }

    async setGoogleTokens(code: string, clientId: string, clientSecret: string, redirectUri: string, userId?: number) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await oauth2Client.getToken(code);

        await Integration.upsert({
            provider: 'google',
            userId: userId || null,
            accessToken: tokens.access_token as string,
            refreshToken: tokens.refresh_token as string,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            isActive: true
        });

        return tokens;
    }

    // 2. Outlook Calendar Integration (Placeholder for logic)
    async getOutlookAuthUrl(clientId: string, redirectUri: string) {
        // Logic for Microsoft OAuth URL
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=offline_access%20Calendars.ReadWrite`;
    }

    // 3. Sync Logic (Generic for now)
    async syncEvents(provider: 'google' | 'outlook', userId: number) {
        const integration = await Integration.findOne({ where: { provider, userId, isActive: true } });
        if (!integration) throw new Error('Integration not found');

        if (provider === 'google') {
            // Implement Google Sync
        } else {
            // Implement Outlook Sync
        }
    }
}

export default new CalendarService();
