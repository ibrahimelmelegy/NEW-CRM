import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { RecruitmentPermissionsEnum } from '../../role/roleEnum';
import controller from './recruitmentController';

const router = express.Router();

// Job Postings
router.get('/postings', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getPostings);
router.post('/postings', authenticateUser, HasPermission([RecruitmentPermissionsEnum.CREATE_RECRUITMENT]), controller.createPosting);
router.put('/postings/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.updatePosting);
router.delete('/postings/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.DELETE_RECRUITMENT]), controller.deletePosting);

// Applicants
router.get('/applicants', authenticateUser, HasPermission([RecruitmentPermissionsEnum.VIEW_RECRUITMENT]), controller.getApplicants);
router.post('/applicants', authenticateUser, HasPermission([RecruitmentPermissionsEnum.CREATE_RECRUITMENT]), controller.createApplicant);
router.put('/applicants/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.EDIT_RECRUITMENT]), controller.updateApplicant);
router.delete('/applicants/:id', authenticateUser, HasPermission([RecruitmentPermissionsEnum.DELETE_RECRUITMENT]), controller.deleteApplicant);

export default router;
