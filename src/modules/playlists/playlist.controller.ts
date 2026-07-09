import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { playlistService } from './playlist.service';
import { sendSuccess, sendMessage } from '../../utils/response';
import {
  PlaylistListQuery,
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from './playlist.schema';

export class PlaylistController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.list(req.query as unknown as PlaylistListQuery, req.user?.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.getBySlug(req.params.slug as string, req.user?.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.create(req.user!.userId, req.body as CreatePlaylistInput);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.update(req.params.id as string, req.user!.userId, req.body as UpdatePlaylistInput);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await playlistService.delete(req.params.id as string, req.user!.userId);
      sendMessage(res, 'Playlist deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async addProblem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.addProblem(req.params.id as string, req.user!.userId, req.body.problemSlug);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async removeProblem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playlistService.removeProblem(req.params.id as string, req.user!.userId, req.params.problemSlug as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const playlistController = new PlaylistController();
