import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validation';
import { CreateOrUpdateSettingInput } from './inputs/createSettingInput';
import SettingController from './settingController';
import { SettingsPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Setting
 *   description: Application settings — branding, email config, company info
 */

const router = express.Router();

/**
 * @swagger
 * /api/setting:
 *   post:
 *     summary: Create or update settings
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailApiKey:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *               favIcon:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Settings saved
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  validateBody(CreateOrUpdateSettingInput),
  SettingController.createSetting
);

/**
 * @swagger
 * /api/setting:
 *   get:
 *     summary: Get application settings
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current application settings
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), SettingController.getSetting);

export default router;
