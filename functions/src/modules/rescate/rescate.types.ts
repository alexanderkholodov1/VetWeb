import { Timestamp } from "firebase-admin/firestore";

export type ReporteEstado = "pendiente" | "en_proceso" | "resuelto";

export interface ReporteInput {
  descripcion: string;
  fotoUrl?: string | null;
  ubicacion: {
    lat: number;
    lng: number;
  };
}

export interface Reporte {
  descripcion: string;
  fotoUrl: string | null;
  ubicacion: {
    lat: number;
    lng: number;
  };
  estado: ReporteEstado;
  reportadoPorUid: string;
  creadoEn: Timestamp;
}
