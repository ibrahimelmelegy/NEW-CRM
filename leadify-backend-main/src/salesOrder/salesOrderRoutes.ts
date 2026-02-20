import { Router } from 'express';
import SalesOrderController from './salesOrderController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SalesOrderPermissionsEnum } from '../role/roleEnum';

const router = Router();

// Create a new sales order
router.post('/', authenticateUser, HasPermission([SalesOrderPermissionsEnum.CREATE_SALES_ORDERS]), SalesOrderController.createOrder);

// List all sales orders with pagination/filters
router.get('/', authenticateUser, HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]), SalesOrderController.getOrders);

// Get a single sales order by ID
router.get('/:id', authenticateUser, HasPermission([SalesOrderPermissionsEnum.VIEW_SALES_ORDERS]), SalesOrderController.getOrderById);

// Update a sales order
router.put('/:id', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updateOrder);

// Update order status
router.patch('/:id/status', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updateStatus);

// Convert deal to sales order
router.post('/from-deal/:dealId', authenticateUser, HasPermission([SalesOrderPermissionsEnum.CONVERT_DEAL_TO_ORDER]), SalesOrderController.convertDealToOrder);

// Add fulfillment to an order
router.post('/:id/fulfillment', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.addFulfillment);

// Update a fulfillment record
router.patch('/:id/fulfillment/:fid', authenticateUser, HasPermission([SalesOrderPermissionsEnum.EDIT_SALES_ORDERS]), SalesOrderController.updateFulfillment);

export default router;
