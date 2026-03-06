
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Store original env so we can restore it
const ORIGINAL_ENV = process.env;

// A valid 64-character hex key (32 bytes)
const VALID_KEY = 'a'.repeat(64);

describe('Encryption Utilities', () => {
    beforeEach(() => {
        jest.resetModules();
        // Create a shallow copy of env so tests don't leak
        process.env = { ...ORIGINAL_ENV, ENCRYPTION_KEY: VALID_KEY };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    /**
     * Helper to import fresh copies of encrypt/decrypt so each test
     * picks up the current process.env.ENCRYPTION_KEY.
     */
    async function loadModule() {
        const mod = await import('../../src/utils/encryption');
        return { encrypt: mod.encrypt, decrypt: mod.decrypt };
    }

    // --------------------------------------------------------------------------
    // 1. Roundtrip
    // --------------------------------------------------------------------------
    describe('encrypt / decrypt roundtrip', () => {
        it('should decrypt back to the original plaintext', async () => {
            const { encrypt, decrypt } = await loadModule();

            const plaintext = 'Hello, World!';
            const ciphertext = encrypt(plaintext);
            const decrypted = decrypt(ciphertext);

            expect(decrypted).toBe(plaintext);
        });

        it('should produce output in iv:authTag:ciphertext hex format', async () => {
            const { encrypt } = await loadModule();

            const ciphertext = encrypt('test');
            const parts = ciphertext.split(':');

            expect(parts).toHaveLength(3);
            // IV is 16 bytes = 32 hex chars
            expect(parts[0]).toHaveLength(32);
            // Auth tag is 16 bytes = 32 hex chars
            expect(parts[1]).toHaveLength(32);
            // Ciphertext should be non-empty hex
            expect(parts[2].length).toBeGreaterThan(0);
            // All parts should be valid hex
            parts.forEach(part => {
                expect(part).toMatch(/^[0-9a-f]+$/);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. Random IV — different output each time
    // --------------------------------------------------------------------------
    describe('random IV', () => {
        it('should produce different ciphertext for the same plaintext', async () => {
            const { encrypt } = await loadModule();

            const plaintext = 'same-input';
            const result1 = encrypt(plaintext);
            const result2 = encrypt(plaintext);

            // Both must decrypt to the same value but the ciphertext must differ
            expect(result1).not.toBe(result2);
        });
    });

    // --------------------------------------------------------------------------
    // 3. Wrong key → decryption fails
    // --------------------------------------------------------------------------
    describe('decrypt with wrong key', () => {
        it('should throw when decrypting with a different key', async () => {
            // Encrypt with key A
            const { encrypt } = await loadModule();
            const ciphertext = encrypt('secret data');

            // Switch to key B and re-import
            process.env.ENCRYPTION_KEY = 'b'.repeat(64);
            jest.resetModules();
            const { decrypt } = await import('../../src/utils/encryption');

            expect(() => decrypt(ciphertext)).toThrow();
        });
    });

    // --------------------------------------------------------------------------
    // 4. Empty string handling
    // --------------------------------------------------------------------------
    describe('empty string', () => {
        it('should encrypt and decrypt an empty string', async () => {
            const { encrypt, decrypt } = await loadModule();

            const ciphertext = encrypt('');
            expect(ciphertext).toBeTruthy();

            const decrypted = decrypt(ciphertext);
            expect(decrypted).toBe('');
        });
    });

    // --------------------------------------------------------------------------
    // 5. Special characters and unicode
    // --------------------------------------------------------------------------
    describe('special characters and unicode', () => {
        it('should handle special characters', async () => {
            const { encrypt, decrypt } = await loadModule();

            const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
            expect(decrypt(encrypt(special))).toBe(special);
        });

        it('should handle unicode / emoji', async () => {
            const { encrypt, decrypt } = await loadModule();

            const unicode = '\u0645\u0631\u062d\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645';
            expect(decrypt(encrypt(unicode))).toBe(unicode);
        });

        it('should handle multi-byte characters', async () => {
            const { encrypt, decrypt } = await loadModule();

            const multiByte = '\u00e9\u00e8\u00ea\u00eb\u00f1\u00fc\u00df\u00e6\u00f8\u00e5';
            expect(decrypt(encrypt(multiByte))).toBe(multiByte);
        });

        it('should handle long strings', async () => {
            const { encrypt, decrypt } = await loadModule();

            const longStr = 'x'.repeat(10000);
            expect(decrypt(encrypt(longStr))).toBe(longStr);
        });
    });

    // --------------------------------------------------------------------------
    // 6. Invalid key scenarios
    // --------------------------------------------------------------------------
    describe('invalid ENCRYPTION_KEY', () => {
        it('should throw when ENCRYPTION_KEY is missing', async () => {
            delete process.env.ENCRYPTION_KEY;
            jest.resetModules();
            const { encrypt } = await import('../../src/utils/encryption');

            expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be a 64-character hex string');
        });

        it('should throw when ENCRYPTION_KEY is too short', async () => {
            process.env.ENCRYPTION_KEY = 'abc123';
            jest.resetModules();
            const { encrypt } = await import('../../src/utils/encryption');

            expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be a 64-character hex string');
        });
    });

    // --------------------------------------------------------------------------
    // 7. Invalid ciphertext format
    // --------------------------------------------------------------------------
    describe('invalid ciphertext', () => {
        it('should throw when ciphertext has wrong format (not 3 parts)', async () => {
            const { decrypt } = await loadModule();

            expect(() => decrypt('not-valid-format')).toThrow('Invalid encrypted format');
        });

        it('should throw when ciphertext has been tampered with', async () => {
            const { encrypt, decrypt } = await loadModule();

            const ciphertext = encrypt('secret');
            const parts = ciphertext.split(':');
            // Tamper with the ciphertext portion
            parts[2] = 'ff'.repeat(parts[2].length / 2);
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });
    });
});
