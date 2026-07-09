import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from './user.schema';

const router = Router();

router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile.bind(userController));
router.post(
  '/me/change-password',
  authenticate,
  validate(changePasswordSchema),
  userController.changePassword.bind(userController)
);
router.get('/:username', userController.getProfile.bind(userController));

export default router;
