import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerSpec from './docs/swagger.js';
import { apiReference } from '@scalar/express-api-reference';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import questionRoutes from './routes/question.routes.js';
import answerRoutes from './routes/answer.routes.js';
import followRoutes from './routes/follow.routes.js';
import commentRoutes from './routes/comment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import feedRoutes from './routes/feed.routes.js';
import searchRoutes from './routes/search.routes.js';
import dmRoutes from './routes/dm.routes.js';
import reportRoutes from './routes/report.routes.js';
import blockRoutes from './routes/block.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import eventsRouter from './routes/events.routes.js';
import pushRouter from './routes/push.routes.js';
import dailyQuestionRoutes from './routes/daily-question.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './db/pool.js';

if (!process.env.JWT_SECRET) {
  throw new Error('[startup] JWT_SECRET environment variable is required');
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'ESN FM API', status: 'running', docs: '/docs' });
});

app.use(
  '/docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://proxy.scalar.com',
          'https://api.scalar.com',
        ],
        workerSrc: ["'self'", 'blob:'],
      },
    },
  }),
  apiReference({ content: swaggerSpec, theme: 'default' })
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventsRouter);
app.use('/api/push', pushRouter);
app.use('/api/daily-question', dailyQuestionRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
  console.log(`[server] docs at http://localhost:${PORT}/docs`);
});

// Daily cleanup: permanently delete items archived more than 30 days ago
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
async function runArchiveCleanup() {
  try {
    const answers = await pool.query(
      `DELETE FROM answers WHERE is_archived = TRUE AND archived_at < NOW() - INTERVAL '30 days'`
    );
    const questions = await pool.query(
      `DELETE FROM questions WHERE is_archived = TRUE AND archived_at < NOW() - INTERVAL '30 days'`
    );
    const total = (answers.rowCount ?? 0) + (questions.rowCount ?? 0);
    if (total > 0) console.log(`[cleanup] deleted ${total} archived item(s) older than 30 days`);
  } catch (err) {
    console.error('[cleanup] archive cleanup failed:', err);
  }
}
setInterval(runArchiveCleanup, CLEANUP_INTERVAL_MS);

// Hourly check: auto-archive QOTD after 24 hours from publish
async function runDailyQuestionExpiry() {
  try {
    const result = await pool.query(
      `UPDATE daily_questions
       SET is_active = FALSE
       WHERE is_active = TRUE
         AND published_at < NOW() - INTERVAL '24 hours'
       RETURNING id`
    );
    if ((result.rowCount ?? 0) > 0) {
      console.log(`[qotd] auto-archived ${result.rowCount} expired question(s)`);
    }
  } catch (err) {
    console.error('[qotd] expiry check failed:', err);
  }
}
setInterval(runDailyQuestionExpiry, 60 * 60 * 1000);
runDailyQuestionExpiry();
