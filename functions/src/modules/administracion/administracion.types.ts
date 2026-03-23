export type UserRole =
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
