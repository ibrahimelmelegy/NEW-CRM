import express from 'express';
import customerSuccessController from './customerSuccessController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Dashboard overview
router.get(
  '/dashboard',
  authenticateUser,
  customerSuccessController.getDashboard
);

// Single client health score
router.get(
  '/client/:id/health',
  authenticateUser,
  customerSuccessController.getClientHealth
);

export default router;
