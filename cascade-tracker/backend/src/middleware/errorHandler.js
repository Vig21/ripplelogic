export function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
