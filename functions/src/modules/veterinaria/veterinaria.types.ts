import { Timestamp } from "firebase-admin/firestore";

export type CitaEstado = "pendiente" | "confirmada" | "cancelada";

export interface MascotaInput {
  nombre: string;
  especie: string;
  raza: string;
  edad: number;
  fotoUrl?: string | null;
}

export interface AtencionInput {
  diagnostico: string;
  tratamiento: string;
  fecha: string;
}

export interface CitaInput {
  mascotaId: string;
  fecha: string;
  hora: string;
}

export interface Cita {
  mascotaId: string;
  duenioUid: string;
  fecha: Timestamp;
  hora: string;
  estado: CitaEstado;
  creadoEn: Timestamp;
}
