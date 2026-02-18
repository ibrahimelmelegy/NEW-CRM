import express from 'express';
import territoryController from './territoryController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

//** --------------------- GET --------------------- */

router.get('/', authenticateUser, territoryController.getTerritories);

router.get('/tree', authenticateUser, territoryController.getTerritoryTree);

router.get('/:id', authenticateUser, territoryController.getTerritoryById);

//** --------------------- POST --------------------- */

router.post('/', authenticateUser, territoryController.createTerritory);

//** --------------------- PUT --------------------- */

router.put('/:id', authenticateUser, territoryController.updateTerritory);

//** --------------------- DELETE --------------------- */

router.delete('/:id', authenticateUser, territoryController.deleteTerritory);

export default router;
