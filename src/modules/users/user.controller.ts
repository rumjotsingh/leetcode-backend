import { Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../utils/response';

export class UserController {
  async getProfile(req: { params: { username: string } }, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await userService.getProfile(req.params.username);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
