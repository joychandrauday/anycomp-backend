// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { QueryFailedError } from 'typeorm';

/* ======================================================
   Custom Base Error
====================================================== */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/* ======================================================
   Custom Application Errors
====================================================== */
export class ValidationAppError extends AppError {
  constructor(public errors: any[]) {
    super(400, 'Validation failed', true, 'VALIDATION_ERROR');
    this.name = 'ValidationAppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(401, message, true, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(403, message, true, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, true, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message, true, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, true, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/* ======================================================
   Error Code Maps
====================================================== */
const DB_ERROR_CODES: Record<string, { status: number; message: string }> = {
  '23505': { status: 409, message: 'Duplicate entry' },
  '23503': { status: 400, message: 'Foreign key constraint violation' },
  '23502': { status: 400, message: 'Not null constraint violation' },
  '22P02': { status: 400, message: 'Invalid input syntax' },
  '42601': { status: 400, message: 'SQL syntax error' },
  '42703': { status: 400, message: 'Undefined column' },
};

const JWT_ERRORS: Record<string, { status: number; message: string }> = {
  JsonWebTokenError: { status: 401, message: 'Invalid token' },
  TokenExpiredError: { status: 401, message: 'Token expired' },
  NotBeforeError: { status: 401, message: 'Token not yet valid' },
};

/* ======================================================
   Main Error Handler
====================================================== */
export const errorHandler = (
  error: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logError(error, req);

  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any[] | undefined;

  // Custom App Errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code ?? 'APP_ERROR';
  }

  // class-validator errors
  else if (Array.isArray(error) && error[0] instanceof ClassValidatorError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = extractValidationErrors(error);
  }

  // TypeORM database errors
  else if (error instanceof QueryFailedError) {
    const dbError = handleDatabaseError(error);
    statusCode = dbError.status;
    message = dbError.message;
    code = 'DATABASE_ERROR';
    details = dbError.errors;
  }

  // JWT errors
  else if (JWT_ERRORS[error.name]) {
    statusCode = JWT_ERRORS[error.name].status;
    message = JWT_ERRORS[error.name].message;
    code = 'AUTHENTICATION_ERROR';
  }

  // Multer errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = handleMulterError(error);
    code = 'FILE_UPLOAD_ERROR';
  }

  // Rate limit
  else if (error.message?.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    code = 'RATE_LIMIT_EXCEEDED';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

/* ======================================================
   Helpers
====================================================== */
const handleDatabaseError = (error: QueryFailedError) => {
  const driverError = error.driverError as {
    code?: string;
    detail?: string;
    table?: string;
    constraint?: string;
  };

  let status = 500;
  let message = 'Database error occurred';
  const errors: any[] = [];

  if (driverError.code && DB_ERROR_CODES[driverError.code]) {
    status = DB_ERROR_CODES[driverError.code].status;
    message = DB_ERROR_CODES[driverError.code].message;

    errors.push({
      code: driverError.code,
      detail: driverError.detail,
      table: driverError.table,
      constraint: driverError.constraint,
    });
  }

  if (driverError.constraint) {
    const match = driverError.constraint.match(/_(.+?)_/);
    if (match) {
      message = `${match[1].replace(/_/g, ' ')} already exists`;
    }
  }

  return { status, message, errors };
};

const handleMulterError = (error: any): string => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'File size exceeds limit';
    case 'LIMIT_FILE_COUNT':
      return 'Too many files uploaded';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Unexpected file field';
    default:
      return 'File upload error';
  }
};

const extractValidationErrors = (
  validationErrors: ClassValidatorError[]
): any[] =>
  validationErrors.map(err => ({
    property: err.property,
    value: err.value,
    constraints: err.constraints,
    children: err.children?.length
      ? extractValidationErrors(err.children)
      : undefined,
  }));

const logError = (error: Error, req: Request): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', {
      method: req.method,
      url: req.originalUrl,
      message: error.message,
      stack: error.stack,
    });
  }
};

/* ======================================================
   Async Wrapper & 404
====================================================== */
export const asyncErrorHandler =
  (fn: Function) =>
    (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(fn(req, res, next)).catch(next);

export const notFoundHandler = (req: Request) => {
  throw new NotFoundError(`Route ${req.method} ${req.path}`);
};
