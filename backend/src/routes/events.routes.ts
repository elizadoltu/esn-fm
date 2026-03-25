import { Router } from 'express';
import { sseConnect } from '../api/events.api.js';

const router = Router();

router.get('/', sseConnect);

export default router;
