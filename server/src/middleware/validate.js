import { AppError } from '../utils/http.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return next(
      new AppError(
        400,
        'Validation failed.',
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      )
    );
  }
  req.body = result.data;
  next();
};
