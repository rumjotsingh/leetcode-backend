import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { registerSchema, loginSchema, refreshTokenSchema, googleLoginSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/google', authRateLimiter, validate(googleLoginSchema), authController.googleLogin.bind(authController));
router.post('/logout', validate(refreshTokenSchema), authController.logout.bind(authController));
router.post('/refresh', validate(refreshTokenSchema), authController.refresh.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
