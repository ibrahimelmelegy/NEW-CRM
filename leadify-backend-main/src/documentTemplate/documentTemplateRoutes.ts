import express from 'express';
import documentTemplateController from './documentTemplateController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validation';
import { CreateTemplateDto } from './dto/createTemplateDto';
import { UpdateTemplateDto } from './dto/updateTemplateDto';
import { DocumentTemplatePermissionsEnum } from '../role/roleEnum';

const router = express.Router();

router.post(
  '/',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  validateBody(CreateTemplateDto),
  documentTemplateController.createTemplate
);

router.put(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.EDIT_DOCUMENT_TEMPLATES]),
  validateBody(UpdateTemplateDto),
  documentTemplateController.updateTemplate
);

router.get(
  '/',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]),
  documentTemplateController.getTemplates
);

router.get(
  '/default-configs',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]),
  documentTemplateController.getDefaultConfigs
);

router.get(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.VIEW_DOCUMENT_TEMPLATES]),
  documentTemplateController.getTemplateById
);

router.delete(
  '/:id',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.DELETE_DOCUMENT_TEMPLATES]),
  documentTemplateController.deleteTemplate
);

router.post(
  '/:id/clone',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  documentTemplateController.cloneTemplate
);

router.post(
  '/seed-defaults',
  authenticateUser,
  HasPermission([DocumentTemplatePermissionsEnum.CREATE_DOCUMENT_TEMPLATES]),
  documentTemplateController.seedDefaults
);

export default router;
