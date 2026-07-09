import { Router } from 'express';
import { playlistController } from './playlist.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  playlistListQuerySchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  playlistProblemSchema,
  playlistIdParamSchema,
  playlistSlugParamSchema,
} from './playlist.schema';

const router = Router();

router.get('/', optionalAuth, validate(playlistListQuerySchema, 'query'), playlistController.list.bind(playlistController));
router.get('/:slug', optionalAuth, validate(playlistSlugParamSchema, 'params'), playlistController.getBySlug.bind(playlistController));
router.post('/', authenticate, validate(createPlaylistSchema), playlistController.create.bind(playlistController));
router.put(
  '/:id',
  authenticate,
  validate(playlistIdParamSchema, 'params'),
  validate(updatePlaylistSchema),
  playlistController.update.bind(playlistController)
);
router.delete(
  '/:id',
  authenticate,
  validate(playlistIdParamSchema, 'params'),
  playlistController.remove.bind(playlistController)
);
router.post(
  '/:id/problems',
  authenticate,
  validate(playlistIdParamSchema, 'params'),
  validate(playlistProblemSchema),
  playlistController.addProblem.bind(playlistController)
);
router.delete(
  '/:id/problems/:problemSlug',
  authenticate,
  validate(playlistIdParamSchema, 'params'),
  playlistController.removeProblem.bind(playlistController)
);

export default router;
