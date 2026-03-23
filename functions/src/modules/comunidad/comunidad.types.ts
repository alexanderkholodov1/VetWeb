import { Timestamp } from "firebase-admin/firestore";

export interface CampanaInput {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface Campana {
  titulo: string;
  descripcion: string;
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  creadoPorUid: string;
  creadoEn: Timestamp;
}

export interface Inscripcion {
  campanaId: string;
  usuarioUid: string;
  creadoEn: Timestamp;
}
