import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ESignaturePermissionsEnum } from '../role/roleEnum';
import c from './eSignatureController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([ESignaturePermissionsEnum.VIEW_E_SIGNATURES]), c.getAll);
router.get('/:id', authenticateUser, HasPermission([ESignaturePermissionsEnum.VIEW_E_SIGNATURES]), c.getById);
router.post('/', authenticateUser, HasPermission([ESignaturePermissionsEnum.CREATE_E_SIGNATURES]), c.create);
router.put('/:id', authenticateUser, HasPermission([ESignaturePermissionsEnum.EDIT_E_SIGNATURES]), c.update);
router.delete('/:id', authenticateUser, HasPermission([ESignaturePermissionsEnum.DELETE_E_SIGNATURES]), c.delete);
router.post('/:id/sign', authenticateUser, HasPermission([ESignaturePermissionsEnum.SIGN_DOCUMENTS]), c.sign);
router.post('/:id/decline', authenticateUser, HasPermission([ESignaturePermissionsEnum.SIGN_DOCUMENTS]), c.decline);
router.post('/:id/remind', authenticateUser, HasPermission([ESignaturePermissionsEnum.CREATE_E_SIGNATURES]), c.resendReminder);

export default router;
