import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError("Recurso no encontrado", 404));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const appError = err instanceof AppError ? err : new AppError("Error interno del servidor", 500);
  res.status(appError.statusCode).json({
    error: true,
    message: appError.message,
    statusCode: appError.statusCode
  });
};
