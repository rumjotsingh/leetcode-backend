import { Router } from 'express';
import { problemController } from './problem.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize, optionalAuth } from '../../middlewares/auth.middleware';
import { ROLES } from '../../config/constants';
import {
  createProblemSchema,
  updateProblemSchema,
  problemListQuerySchema,
  problemIdParamSchema,
} from './problem.schema';

const router = Router();

router.get('/', optionalAuth, validate(problemListQuerySchema, 'query'), problemController.list.bind(problemController));
router.get('/:id', optionalAuth, validate(problemIdParamSchema, 'params'), problemController.getById.bind(problemController));

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createProblemSchema),
  problemController.create.bind(problemController)
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(problemIdParamSchema, 'params'),
  validate(updateProblemSchema),
  problemController.update.bind(problemController)
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(problemIdParamSchema, 'params'),
  problemController.delete.bind(problemController)
);

export default router;
