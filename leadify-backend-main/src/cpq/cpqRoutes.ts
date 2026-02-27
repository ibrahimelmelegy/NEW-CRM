import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CpqPermissionsEnum } from '../role/roleEnum';
import controller from './cpqController';

const router = express.Router();

// Quote generation and validation
router.post('/generate-quote', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.generateQuote);
router.post('/validate-pricing', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.validatePricing);

// Price books CRUD
router.get('/price-books', authenticateUser, HasPermission([CpqPermissionsEnum.VIEW_CPQ]), controller.getPriceBooks);
router.post('/price-books', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.createPriceBook);
router.put('/price-books/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updatePriceBook);
router.delete('/price-books/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deletePriceBook);

// Price book entries CRUD
router.post('/entries', authenticateUser, HasPermission([CpqPermissionsEnum.CREATE_CPQ]), controller.addEntry);
router.put('/entries/:id', authenticateUser, HasPermission([CpqPermissionsEnum.EDIT_CPQ]), controller.updateEntry);
router.delete('/entries/:id', authenticateUser, HasPermission([CpqPermissionsEnum.DELETE_CPQ]), controller.deleteEntry);

export default router;
