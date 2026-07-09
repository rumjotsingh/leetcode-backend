import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, dashboardController.getDashboard.bind(dashboardController));

export default router;
