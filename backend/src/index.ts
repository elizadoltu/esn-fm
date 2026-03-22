import express from 'express';
import cors from 'cors';
import swaggerSpec from './docs/swagger.js';
import { apiReference } from '@scalar/express-api-reference';

import userRoutes from './routes/user.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'ESN HR App API',
    status: 'running',
    endpoints: {
      docs: '/docs',
      users: '/api/users',
    },
  });
});

app.use(
  '/docs',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: 'default',
  })
);

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/docs`);
  console.log(`API: http://localhost:${PORT}/api/users`);
});
