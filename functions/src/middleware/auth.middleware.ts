import { NextFunction, Request, Response } from "express";
import { auth, db } from "../shared/firestore";
import { AppError } from "./error.middleware";
import { UserRole } from "../types/express";

const BEARER_PREFIX = "Bearer ";

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new AppError("Token de autenticacion ausente", 401);
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    const decoded = await auth.verifyIdToken(token);

    const userDoc = await db.collection("usuarios").doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : undefined;

    req.user = {
      ...decoded,
      role: (userData?.rol as UserRole | undefined) ?? (decoded.role as UserRole | undefined),
      fcmToken: userData?.fcmToken as string | undefined
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError("Token invalido", 401));
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      next(new AppError("No tiene permisos para este recurso", 403));
      return;
    }

    next();
  };
};
