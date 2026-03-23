import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../shared/firestore";
import { fcmService } from "../../shared/fcm";
import { AppError } from "../../middleware/error.middleware";
import { CampanaInput } from "./comunidad.types";

const parseFecha = (fecha: string): Timestamp => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Fecha invalida", 400);
  }
  return Timestamp.fromDate(date);
};

export class ComunidadService {
  async crearCampana(input: CampanaInput, creadoPorUid: string) {
    if (!input.titulo?.trim() || !input.descripcion?.trim() || !input.fechaInicio || !input.fechaFin) {
      throw new AppError("Campos obligatorios incompletos", 400);
    }

    const fechaInicio = parseFecha(input.fechaInicio);
    const fechaFin = parseFecha(input.fechaFin);

    if (fechaInicio.toMillis() > fechaFin.toMillis()) {
      throw new AppError("fechaInicio debe ser menor o igual a fechaFin", 400);
    }

    const payload = {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      fechaInicio,
      fechaFin,
      creadoPorUid,
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("campanas").add(payload);

    await fcmService.broadcastToUsers("Nueva campana activa", payload.titulo);

    return { id: docRef.id, ...payload };
  }

  async listarCampanasActivas() {
    const now = Timestamp.now();
    const snapshot = await db.collection("campanas").where("fechaFin", ">=", now).orderBy("fechaFin", "asc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async crearInscripcion(campanaId: string, usuarioUid: string) {
    const campanaDoc = await db.collection("campanas").doc(campanaId).get();
    if (!campanaDoc.exists) {
      throw new AppError("Campana no encontrada", 404);
    }

    const existing = await db
      .collection("inscripciones")
      .where("campanaId", "==", campanaId)
      .where("usuarioUid", "==", usuarioUid)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new AppError("El usuario ya esta inscrito en esta campana", 409);
    }

    const payload = {
      campanaId,
      usuarioUid,
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("inscripciones").add(payload);
    return { id: docRef.id, ...payload };
  }

  async listarInscripciones(campanaId: string) {
    const campanaDoc = await db.collection("campanas").doc(campanaId).get();
    if (!campanaDoc.exists) {
      throw new AppError("Campana no encontrada", 404);
    }

    const snapshot = await db.collection("inscripciones").where("campanaId", "==", campanaId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const comunidadService = new ComunidadService();
