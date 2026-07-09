import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await dashboardService.getDashboard(req.user!.userId);
      sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
