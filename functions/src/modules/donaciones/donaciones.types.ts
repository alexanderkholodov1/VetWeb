import { Timestamp } from "firebase-admin/firestore";

export type DonacionEstado = "exitosa" | "fallida";
export type ApadrinamientoEstado = "activo" | "cancelado";

export interface DonacionInput {
  monto: number;
  metodoPago: string;
}

export interface ApadrinamientoInput {
  animalId: string;
  montoMensual: number;
  metodoPago: string;
}

export interface Donacion {
  donorUid: string;
  monto: number;
  metodoPago: string;
  pagoId: string | null;
  estado: DonacionEstado;
  creadoEn: Timestamp;
}

export interface Apadrinamiento {
  animalId: string;
  padrinoUid: string;
  montoMensual: number;
  estado: ApadrinamientoEstado;
  pagoId: string;
  creadoEn: Timestamp;
}
