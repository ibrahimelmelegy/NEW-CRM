import { LeadStatusEnums, LeadSourceEnums } from './leadEnum';
// @ts-ignore
import LeadService from './leadService';

describe('Lead Scoring Logic', () => {
    it('should calculate 100 points for a perfect lead', () => {
        const perfectLead = {
            email: 'test@example.com',
            phone: '123456789',
            companyName: 'Perfect Corp',
            leadSource: 'REFERRAL',
            notes: 'This is a very long and detailed note that should trigger bonus points.',
            status: 'NEEDS_ATTENTION',
            lastContactDate: new Date()
        };

        const score = (LeadService as any).calculateScore(perfectLead);
        expect(score).toBe(100);
    });

    it('should calculate 0 points for a lead without details', () => {
        const poorLead = {
            status: 'NEW',
        };

        const score = (LeadService as any).calculateScore(poorLead);
        expect(score).toBe(0);
    });

    it('should give 60 points for email and phone only', () => {
        const contactOnlyLead = {
            email: 'test@example.com',
            phone: '123456789',
            status: 'NEW'
        };

        const score = (LeadService as any).calculateScore(contactOnlyLead);
        expect(score).toBe(60);
    });

    it('should cap the score at 100', () => {
        const overachieverLead = {
            email: 'a@b.com',
            phone: '1',
            companyName: 'X',
            leadSource: 'REFERRAL',
            notes: 'x'.repeat(100),
            status: 'IN_PROGRESS',
            lastContactDate: new Date(),
            extra: 'Should not count'
        };

        const score = (LeadService as any).calculateScore(overachieverLead);
        expect(score).toBeLessThanOrEqual(100);
    });
});
