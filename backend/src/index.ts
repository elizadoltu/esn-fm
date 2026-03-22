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
import { errorHandler } from './middleware/errorHandler.js';

if (!process.env.JWT_SECRET) {
  throw new Error('[startup] JWT_SECRET environment variable is required');
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'ESN FM API',
    status: 'running',
    docs: '/docs',
  });
});

app.use(
  '/docs',
  apiReference({
    spec: { content: swaggerSpec },
    theme: 'default',
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/follows', followRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
  console.log(`[server] docs at http://localhost:${PORT}/docs`);
});
