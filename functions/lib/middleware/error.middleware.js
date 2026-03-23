"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
const notFoundHandler = (_req, _res, next) => {
    next(new AppError("Recurso no encontrado", 404));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    const appError = err instanceof AppError ? err : new AppError("Error interno del servidor", 500);
    res.status(appError.statusCode).json({
        error: true,
        message: appError.message,
        statusCode: appError.statusCode
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map