import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { subscribePush, unsubscribePush } from '../api/push.api.js';

const router = Router();

/** Save or update a push subscription for the current user's device. */
router.post('/subscribe', verifyJWT, subscribePush);

/** Remove a push subscription (called when user disables notifications). */
router.delete('/subscribe', verifyJWT, unsubscribePush);

export default router;
