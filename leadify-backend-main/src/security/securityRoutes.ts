import express from 'express';
import twoFactorRoutes from './twoFactorRoutes';
import fieldPermissionRoutes from './fieldPermissionRoutes';
import dataShareRoutes from './dataShareRoutes';
import sessionSecurityRoutes from './sessionSecurityRoutes';

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security — 2FA, field permissions, session management, data sharing
 */

const router = express.Router();

router.get('/', (_req, res) => res.json({ status: 'ok' }));

// 2FA / MFA routes: /api/security/2fa/*
router.use('/2fa', twoFactorRoutes);

// Field-level permission routes: /api/security/field-permissions/*
router.use('/field-permissions', fieldPermissionRoutes);

// Session security routes: /api/security/session/*
router.use('/session', sessionSecurityRoutes);

// Data sharing routes: /api/security/sharing-rules/*, /api/security/share/*, /api/security/shares/*
router.use('/', dataShareRoutes);

export default router;
