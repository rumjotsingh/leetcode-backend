import { Router } from 'express';
import { discussionController } from './discussion.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  discussionListQuerySchema,
  createDiscussionSchema,
  createReplySchema,
  updateDiscussionSchema,
  discussionIdParamSchema,
  problemDiscussionsParamSchema,
} from './discussion.schema';

const router = Router();

router.get(
  '/problem/:problemSlug',
  validate(problemDiscussionsParamSchema, 'params'),
  validate(discussionListQuerySchema, 'query'),
  discussionController.listByProblem.bind(discussionController)
);
router.get('/:id', validate(discussionIdParamSchema, 'params'), discussionController.getById.bind(discussionController));
router.post('/', authenticate, validate(createDiscussionSchema), discussionController.create.bind(discussionController));
router.post(
  '/:id/replies',
  authenticate,
  validate(discussionIdParamSchema, 'params'),
  validate(createReplySchema),
  discussionController.reply.bind(discussionController)
);
router.patch(
  '/:id',
  authenticate,
  validate(discussionIdParamSchema, 'params'),
  validate(updateDiscussionSchema),
  discussionController.update.bind(discussionController)
);
router.delete(
  '/:id',
  authenticate,
  validate(discussionIdParamSchema, 'params'),
  discussionController.remove.bind(discussionController)
);
router.post(
  '/:id/upvote',
  authenticate,
  validate(discussionIdParamSchema, 'params'),
  discussionController.upvoteDiscussion.bind(discussionController)
);
router.post(
  '/replies/:id/upvote',
  authenticate,
  validate(discussionIdParamSchema, 'params'),
  discussionController.upvoteReply.bind(discussionController)
);

export default router;
