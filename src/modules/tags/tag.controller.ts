import { Response, NextFunction } from 'express';
import { tagService } from './tag.service';
import { sendSuccess } from '../../utils/response';

export class TagController {
  async getAll(_req: unknown, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await tagService.getAll();
      sendSuccess(res, tags);
    } catch (error) {
      next(error);
    }
  }
}

export const tagController = new TagController();
