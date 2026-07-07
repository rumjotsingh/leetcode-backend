import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { problemService } from './problem.service';
import { sendSuccess, sendMessage } from '../../utils/response';
import { CreateProblemInput, UpdateProblemInput, ProblemListQuery } from './problem.schema';

export class ProblemController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await problemService.create(req.body as CreateProblemInput, req.user!.userId);
      sendSuccess(res, problem, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await problemService.update(req.params.id as string, req.body as UpdateProblemInput);
      sendSuccess(res, problem);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await problemService.delete(req.params.id as string);
      sendMessage(res, 'Problem deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeTestCases = req.user?.role === 'ADMIN';
      const problem = await problemService.getById(req.params.id as string, includeTestCases);
      sendSuccess(res, problem);
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await problemService.list(req.query as unknown as ProblemListQuery, req.user?.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const problemController = new ProblemController();
