import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { RecruitmentPermissionsEnum } from '../../role/roleEnum';
import controller from './recruitmentController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getPostings);

// Job Postings
router.get('/postings', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getPostings);
router.post('/postings', authenticateUser, HasPermission([RecruitmentPermissionsEnum.CREATE_RECRUITMENT]), controller.createPosting);
router.put('/postings/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.updatePosting);
router.put('/postings/:id/close', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.closePosting);
router.delete('/postings/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.DELETE_RECRUITMENT]), controller.deletePosting);

// Posting analytics
router.get(
  '/postings/:postingId/funnel',
  authenticateUser,
  HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]),
  controller.getRecruitmentFunnel
);
router.get(
  '/postings/:postingId/analytics',
  authenticateUser,
  HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]),
  controller.getPostingAnalytics
);

// Hiring metrics
router.get('/metrics/time-to-hire', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getTimeToHire);
router.get('/metrics/check-duplicate', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.checkDuplicate);

// Applicants
router.get('/applicants', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getApplicants);
router.post('/applicants', authenticateUser, HasPermission([RecruitmentPermissionsEnum.CREATE_RECRUITMENT]), controller.createApplicant);
router.put('/applicants/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.updateApplicant);
router.put('/applicants/:id/stage', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.moveApplicantStage);
router.delete('/applicants/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.DELETE_RECRUITMENT]), controller.deleteApplicant);

export default router;
