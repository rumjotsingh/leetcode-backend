import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { authService } from './auth.service';
import { sendSuccess, sendMessage } from '../../utils/response';
import { RegisterInput, LoginInput, RefreshTokenInput, GoogleLoginInput } from './auth.schema';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as LoginInput);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      await authService.logout(refreshToken);
      sendMessage(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.googleLogin(req.body as GoogleLoginInput);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
