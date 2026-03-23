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

export interface SectorReporte {
  sector: string;
  cantidad: number;
}
