import express from 'express';

describe('Backend Smoke Test', () => {
    it('should have a working environment', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should be able to import core modules', () => {
        expect(express).toBeDefined();
    });
});
