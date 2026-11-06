import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '../utils/http.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : err.message;
    return res.status(400).json({ message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A record with these details already exists.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'The requested record was not found.' });
    }
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
};
