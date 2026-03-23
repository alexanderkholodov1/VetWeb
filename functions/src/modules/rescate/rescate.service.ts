import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../shared/firestore";
import { AppError } from "../../middleware/error.middleware";
import { ReporteEstado, ReporteInput } from "./rescate.types";

const REPORTES_COLLECTION = "reportes";
const ESTADOS_VALIDOS: ReporteEstado[] = ["pendiente", "en_proceso", "resuelto"];

export class RescateService {
  async crearReporte(input: ReporteInput, uid: string) {
    if (!input.descripcion?.trim() || typeof input.ubicacion?.lat !== "number" || typeof input.ubicacion?.lng !== "number") {
      throw new AppError("Campos obligatorios incompletos", 400);
    }

    const payload = {
      descripcion: input.descripcion.trim(),
      fotoUrl: input.fotoUrl ?? null,
      ubicacion: input.ubicacion,
      estado: "pendiente" as ReporteEstado,
      reportadoPorUid: uid,
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection(REPORTES_COLLECTION).add(payload);
    return { id: docRef.id, ...payload };
  }

  async listarReportes(filters: { estado?: string; limit?: number }) {
    const { estado, limit } = filters;
    let query: FirebaseFirestore.Query = db.collection(REPORTES_COLLECTION).orderBy("creadoEn", "desc");

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado as ReporteEstado)) {
        throw new AppError("Estado de reporte invalido", 400);
      }
      query = query.where("estado", "==", estado);
    }

    if (limit && Number.isInteger(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async actualizarEstado(id: string, estado: string) {
    if (!ESTADOS_VALIDOS.includes(estado as ReporteEstado)) {
      throw new AppError("Estado de reporte invalido", 400);
    }

    const docRef = db.collection(REPORTES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError("Reporte no encontrado", 404);
    }

    await docRef.update({ estado });
    return { id, estado };
  }
}

export const rescateService = new RescateService();
