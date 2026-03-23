import { DecodedIdToken } from "firebase-admin/auth";

export type UserRole =
  | "user"
  | "staff"
  | "admin"
  | "ciudadano"
  | "dueno"
  | "veterinario"
  | "voluntario"
  | "administrador"
  | "donante";

export interface AuthenticatedUser extends DecodedIdToken {
  role?: UserRole;
  fcmToken?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
