
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { loginUser } from '../../src/user/authController';
import User from '../../src/user/userModel';
import LoginFailure from '../../src/user/models/loginFailureModel';
import Session from '../../src/user/models/sessionModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

// Mocks
jest.mock('../../src/user/userModel');
jest.mock('../../src/user/models/loginFailureModel');
jest.mock('../../src/user/models/sessionModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('nodemailer'); // Prevent email side effects
jest.mock('otplib', () => ({
    verifySync: jest.fn(),
    authenticator: { generate: jest.fn(), verify: jest.fn() }
}));

describe('AuthController - loginUser', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: { email: 'test@test.com', password: 'password123' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        } as unknown as Response;
        next = jest.fn();

        // Default: No recent failures
        (LoginFailure.count as jest.Mock<any>).mockResolvedValue(0);
    });

    it('should return 200 and token on successful login', async () => {
        // Arrange
        const mockUser = { id: 1, password: 'hashedpassword' };
        (User.findOne as jest.Mock<any>).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true); // Password match
        (jwt.sign as jest.Mock<any>).mockReturnValue('fake-token');

        // Act
        await loginUser(req, res, next);

        // Assert
        expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
        expect(Session.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, token: 'fake-token' }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ body: { token: 'fake-token' } }));
    });

    it('should return 401 if user not found (prevents user enumeration)', async () => {
        // Arrange
        (User.findOne as jest.Mock<any>).mockResolvedValue(null);

        // Act
        await loginUser(req, res, next);

        // Assert
        expect(LoginFailure.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if password does not match', async () => {
        // Arrange
        const mockUser = { id: 1, password: 'hashedpassword' };
        (User.findOne as jest.Mock<any>).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock<any>).mockResolvedValue(false); // Wrong password

        // Act
        await loginUser(req, res, next);

        // Assert
        expect(LoginFailure.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 429 if too many failed attempts (Lockout)', async () => {
        // Arrange
        (LoginFailure.count as jest.Mock<any>).mockResolvedValue(5); // Max attempts reached

        // Act
        await loginUser(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(429);
        // Should NOT proceed to check user
        expect(User.findOne).not.toHaveBeenCalled();
    });
});
