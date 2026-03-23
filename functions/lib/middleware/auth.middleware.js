"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const firestore_1 = require("../shared/firestore");
const error_middleware_1 = require("./error.middleware");
const BEARER_PREFIX = "Bearer ";
const normalizeRole = (role) => {
    const value = String(role || "").toLowerCase();
    if (value === "admin" || value === "administrador") {
        return "admin";
    }
    if (value === "staff" || value === "veterinario" || value === "voluntario") {
        return "staff";
    }
    if (value) {
        return "user";
    }
    return null;
};
const authenticate = async (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith(BEARER_PREFIX)) {
            throw new error_middleware_1.AppError("Token de autenticacion ausente", 401);
        }
        const token = header.slice(BEARER_PREFIX.length).trim();
        const decoded = await firestore_1.auth.verifyIdToken(token);
        const userDoc = await firestore_1.db.collection("usuarios").doc(decoded.uid).get();
        const userData = userDoc.exists ? userDoc.data() : undefined;
        req.user = {
            ...decoded,
            role: userData?.rol ?? decoded.role,
            fcmToken: userData?.fcmToken
        };
        next();
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            next(error);
            return;
        }
        next(new error_middleware_1.AppError("Token invalido", 401));
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        const role = normalizeRole(req.user?.role);
        const allowed = roles.map((item) => normalizeRole(item));
        if (!role || !allowed.includes(role)) {
            next(new error_middleware_1.AppError("No tiene permisos para este recurso", 403));
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map