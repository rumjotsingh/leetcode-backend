import { Router } from 'express';
import { userController } from './user.controller';

const router = Router();

router.get('/:username', userController.getProfile.bind(userController));

export default router;
