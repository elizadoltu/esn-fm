import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { verifyJWT } from '../middleware/auth.js';

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
router.post(
  '/',
  verifyJWT,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const uploadType = (req.body.type as string) === 'cover' ? 'cover' : 'avatar';
      const folder = `esnfm/${uploadType}s`;

      // Stream buffer to Cloudinary
      const url = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `${req.user!.id}_${Date.now()}`,
            overwrite: true,
            transformation:
              uploadType === 'avatar'
                ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
                : [{ width: 1200, height: 400, crop: 'fill' }],
          },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error('Upload failed'));
            resolve(result.secure_url);
          }
        );
        stream.end(req.file!.buffer);
      });

      res.json({ url });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
