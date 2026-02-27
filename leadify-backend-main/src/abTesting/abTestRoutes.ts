import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { AbTestPermissionsEnum } from '../role/roleEnum';
import c from './abTestController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([AbTestPermissionsEnum.VIEW_AB_TESTS]), c.getAll);
router.post('/', authenticateUser, HasPermission([AbTestPermissionsEnum.CREATE_AB_TESTS]), c.create);
router.put('/:id', authenticateUser, HasPermission([AbTestPermissionsEnum.EDIT_AB_TESTS]), c.update);
router.delete('/:id', authenticateUser, HasPermission([AbTestPermissionsEnum.DELETE_AB_TESTS]), c.delete);

export default router;
