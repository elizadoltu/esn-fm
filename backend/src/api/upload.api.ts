import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const rawType = req.body.type as string;
    let uploadType = 'avatar';
    if (rawType === 'cover') uploadType = 'cover';
    else if (rawType === 'answer') uploadType = 'answer';
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
              : uploadType === 'cover'
                ? [{ width: 1200, height: 400, crop: 'fill' }]
                : [{ width: 1200, crop: 'limit' }],
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
