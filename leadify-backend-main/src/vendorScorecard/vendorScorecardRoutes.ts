import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { VendorScorecardPermissionsEnum } from '../role/roleEnum';
import c from './vendorScorecardController';

const router = express.Router();

router.get('/ranking', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.VIEW_VENDOR_SCORECARDS]), c.getVendorRanking);
router.get('/benchmark', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.VIEW_VENDOR_SCORECARDS]), c.getBenchmark);
router.get('/underperformers', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.VIEW_VENDOR_SCORECARDS]), c.flagUnderperformers);
router.get('/vendor/:vendorId/trend', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.VIEW_VENDOR_SCORECARDS]), c.getVendorTrend);
router.get('/', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.VIEW_VENDOR_SCORECARDS]), c.getAll);
router.post('/', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.CREATE_VENDOR_SCORECARDS]), c.create);
router.put('/:id', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.EDIT_VENDOR_SCORECARDS]), c.update);
router.delete('/:id', authenticateUser, HasPermission([VendorScorecardPermissionsEnum.DELETE_VENDOR_SCORECARDS]), c.delete);

export default router;
