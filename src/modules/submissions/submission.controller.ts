import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { submissionService } from './submission.service';
import { sendSuccess } from '../../utils/response';
import { CreateSubmissionInput, RunCodeInput, SubmissionHistoryQuery } from './submission.schema';
import { ROLES } from '../../config/constants';

export class SubmissionController {
  async run(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await submissionService.run(req.body as RunCodeInput);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await submissionService.create(req.body as CreateSubmissionInput, req.user!.userId);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === ROLES.ADMIN;
      const submission = await submissionService.getById(req.params.id as string, req.user!.userId, isAdmin);
      sendSuccess(res, submission);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await submissionService.getHistory(
        req.user!.userId,
        req.query as unknown as SubmissionHistoryQuery
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
