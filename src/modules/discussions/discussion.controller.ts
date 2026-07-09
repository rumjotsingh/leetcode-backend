import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { discussionService } from './discussion.service';
import { sendSuccess, sendMessage } from '../../utils/response';
import {
  DiscussionListQuery,
  CreateDiscussionInput,
  CreateReplyInput,
  UpdateDiscussionInput,
} from './discussion.schema';

export class DiscussionController {
  async listByProblem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.listByProblem(
        req.params.problemSlug as string,
        req.query as unknown as DiscussionListQuery
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.getById(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.create(req.user!.userId, req.body as CreateDiscussionInput);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async reply(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.reply(req.params.id as string, req.user!.userId, req.body as CreateReplyInput);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.update(req.params.id as string, req.user!.userId, req.body as UpdateDiscussionInput);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await discussionService.delete(req.params.id as string, req.user!.userId);
      sendMessage(res, 'Discussion deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async upvoteDiscussion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.upvoteDiscussion(req.params.id as string, req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async upvoteReply(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discussionService.upvoteReply(req.params.id as string, req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const discussionController = new DiscussionController();
