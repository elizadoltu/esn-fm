import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { verifyJWT } from '../middleware/auth.js';
import { uploadFile } from '../api/upload.api.js';

const router = Router();

// Keep files in memory — they go straight to Cloudinary, never touch disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload an image (avatar or cover)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [avatar, cover]
 *     responses:
 *       200:
 *         description: "Returns { url: string }"
 *       400:
 *         description: No file or invalid type
 */
router.post('/', verifyJWT, upload.single('file'), uploadFile);

export default router;
