import { Router } from 'express';
import { tagController } from './tag.controller';

const router = Router();

router.get('/', tagController.getAll.bind(tagController));

export default router;
