import swaggerJSDoc, { Options } from 'swagger-jsdoc';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Determine the correct API file paths based on environment
const apiPaths = isDevelopment
  ? ['./src/routes/*.ts'] // Development: scan TypeScript files
  : ['./dist/routes/*.js']; // Production: scan compiled JavaScript files

const options: Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'ESN HR App API',
      version: '1.0.0',
      description: 'API documentation for ESN HR App using Scalar',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: isDevelopment ? 'Local dev server' : 'Production server',
      },
    ],
  },

  // Scan route files for OpenAPI JSDoc (TypeScript in dev, JavaScript in prod)
  apis: apiPaths,
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
