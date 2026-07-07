import { Router } from 'express';
import { submissionController } from './submission.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { submissionRateLimiter } from '../../middlewares/rateLimit.middleware';
import {
  createSubmissionSchema,
  runCodeSchema,
  submissionHistoryQuerySchema,
  submissionIdParamSchema,
} from './submission.schema';

const router = Router();

router.use(authenticate);

router.post(
  '/run',
  submissionRateLimiter,
  validate(runCodeSchema),
  submissionController.run.bind(submissionController)
);

router.post(
  '/',
  submissionRateLimiter,
  validate(createSubmissionSchema),
  submissionController.create.bind(submissionController)
);

router.get(
  '/history',
  validate(submissionHistoryQuerySchema, 'query'),
  submissionController.getHistory.bind(submissionController)
);

router.get(
  '/:id',
  validate(submissionIdParamSchema, 'params'),
  submissionController.getById.bind(submissionController)
);

export default router;
