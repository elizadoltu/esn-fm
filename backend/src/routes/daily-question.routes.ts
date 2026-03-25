import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getActiveDailyQuestion,
  getActiveDailyQuestionAnswers,
  answerDailyQuestion,
  toggleDailyAnswerLike,
  getDailyAnswerComments,
  postDailyAnswerComment,
  getDailyQuestionArchive,
  getUserDailyAnswers,
  getDailyQuestionById,
  getDailyQuestionAnswersById,
} from '../api/daily-question.api.js';

const router = Router();

// ── GET /api/daily-question/active ────────────────────────────────────────────
// Returns the currently active QOTD plus the requesting user's answer (if any).
router.get('/active', getActiveDailyQuestion);

// ── GET /api/daily-question/active/answers ────────────────────────────────────
// Returns paginated answers for the active QOTD (only show_on_feed = true).
router.get('/active/answers', getActiveDailyQuestionAnswers);

// ── POST /api/daily-question/:id/answer ──────────────────────────────────────
// Submit (or update) an answer to a QOTD.
router.post('/:id/answer', verifyJWT, answerDailyQuestion);

// ── POST /api/daily-question/answers/:id/like ─────────────────────────────────
// Toggle like on a QOTD answer.
router.post('/answers/:id/like', verifyJWT, toggleDailyAnswerLike);

// ── GET /api/daily-question/answers/:id/comments ─────────────────────────────
router.get('/answers/:id/comments', getDailyAnswerComments);

// ── POST /api/daily-question/answers/:id/comments ────────────────────────────
router.post('/answers/:id/comments', verifyJWT, postDailyAnswerComment);

// ── GET /api/daily-question/archive ──────────────────────────────────────────
// Paginated list of past (published + inactive) QOTDs.
router.get('/archive', getDailyQuestionArchive);

// ── GET /api/daily-question/user/:username ────────────────────────────────────
// A user's QOTD answers, for display on their profile.
// show_on_feed filter is bypassed for the owner (resolved via optional JWT).
router.get('/user/:username', getUserDailyAnswers);

// ── GET /api/daily-question/:id ───────────────────────────────────────────────
// Get a single QOTD by ID (for the detail/archive page).
router.get('/:id', getDailyQuestionById);

// ── GET /api/daily-question/:id/answers ──────────────────────────────────────
// Paginated answers for any QOTD by ID (used on the detail page).
router.get('/:id/answers', getDailyQuestionAnswersById);

export default router;
