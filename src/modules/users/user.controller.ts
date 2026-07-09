import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { userService } from './user.service';
import { sendSuccess, sendMessage } from '../../utils/response';
import { UpdateProfileInput, ChangePasswordInput } from './user.schema';

export class UserController {
  async getProfile(req: { params: { username: string } }, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await userService.getProfile(req.params.username);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await userService.updateProfile(req.user!.userId, req.body as UpdateProfileInput);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.changePassword(req.user!.userId, req.body as ChangePasswordInput);
      sendMessage(res, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
