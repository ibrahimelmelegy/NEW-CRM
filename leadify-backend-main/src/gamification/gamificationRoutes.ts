import { Router } from 'express';
import gamificationController from './gamificationController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Gamification
 *   description: Points, achievements, leaderboard, and challenges
 */

/**
 * @swagger
 * /api/gamification:
 *   get:
 *     summary: Get the points leaderboard
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranked leaderboard of users by total points
 */
router.get('/', authenticateUser, gamificationController.getLeaderboard);

/**
 * @swagger
 * /api/gamification/my-points:
 *   get:
 *     summary: Get the authenticated user's points summary
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's total points and recent point history
 */
router.get('/my-points', authenticateUser, gamificationController.getMyPoints);

/**
 * @swagger
 * /api/gamification/award:
 *   post:
 *     summary: Award points to a user
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - points
 *               - reason
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to award points to
 *               points:
 *                 type: integer
 *                 description: Number of points to award
 *               reason:
 *                 type: string
 *                 description: Reason for awarding points
 *               entityType:
 *                 type: string
 *                 description: Related entity type (e.g. deal, lead)
 *               entityId:
 *                 type: string
 *                 description: Related entity ID
 *     responses:
 *       201:
 *         description: Points awarded successfully
 */
router.post('/award', authenticateUser, gamificationController.awardPoints);

/**
 * @swagger
 * /api/gamification/achievements:
 *   get:
 *     summary: Get all achievement definitions
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all achievements ordered by points value
 */
router.get('/achievements', authenticateUser, gamificationController.getAchievements);

/**
 * @swagger
 * /api/gamification/achievements:
 *   post:
 *     summary: Create a new achievement definition
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - pointsValue
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *                 maxLength: 50
 *               pointsValue:
 *                 type: integer
 *                 description: Points value for this achievement
 *               criteria:
 *                 type: string
 *                 maxLength: 100
 *                 description: Criteria description for earning the achievement
 *     responses:
 *       201:
 *         description: Achievement created successfully
 */
router.post('/achievements', authenticateUser, gamificationController.createAchievement);

/**
 * @swagger
 * /api/gamification/achievements/{id}:
 *   delete:
 *     summary: Delete an achievement definition
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Achievement ID
 *     responses:
 *       200:
 *         description: Achievement deleted successfully
 *       404:
 *         description: Achievement not found
 */
router.delete('/achievements/:id', authenticateUser, gamificationController.deleteAchievement);

/**
 * @swagger
 * /api/gamification/achievements/me:
 *   get:
 *     summary: Get the authenticated user's earned achievements
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of achievements earned by the current user
 */
router.get('/achievements/me', authenticateUser, gamificationController.getMyAchievements);

/**
 * @swagger
 * /api/gamification/challenges:
 *   get:
 *     summary: Get active challenges for the authenticated user
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of challenges with progress for the current user
 */
router.get('/challenges', authenticateUser, gamificationController.getChallenges);

export default router;
