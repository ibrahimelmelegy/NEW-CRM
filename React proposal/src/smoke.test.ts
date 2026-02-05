import { describe, it, expect } from 'vitest';

describe('Proposal System Smoke Test', () => {
    it('should have a working vitest environment', () => {
        expect(true).toBe(true);
    });

    it('should be able to access environment variables', () => {
        expect(import.meta.env).toBeDefined();
    });
});
