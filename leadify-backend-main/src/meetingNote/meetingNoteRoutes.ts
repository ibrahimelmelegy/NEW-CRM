import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { MeetingNotePermissionsEnum } from '../role/roleEnum';
import c from './meetingNoteController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([MeetingNotePermissionsEnum.VIEW_MEETING_NOTES]), c.getAll);
router.get('/:id', authenticateUser, HasPermission([MeetingNotePermissionsEnum.VIEW_MEETING_NOTES]), c.getById);
router.post('/', authenticateUser, HasPermission([MeetingNotePermissionsEnum.CREATE_MEETING_NOTES]), c.create);
router.put('/:id', authenticateUser, HasPermission([MeetingNotePermissionsEnum.EDIT_MEETING_NOTES]), c.update);
router.delete('/:id', authenticateUser, HasPermission([MeetingNotePermissionsEnum.DELETE_MEETING_NOTES]), c.delete);

export default router;
