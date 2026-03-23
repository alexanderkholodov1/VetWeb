import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../shared/firestore";
import { AppError } from "../../middleware/error.middleware";
import { AtencionInput, CitaInput, CitaEstado, MascotaInput } from "./veterinaria.types";

const CITAS_OCUPADAS: CitaEstado[] = ["pendiente", "confirmada"];

const parseFecha = (fecha: string): Timestamp => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Fecha invalida", 400);
  }
  return Timestamp.fromDate(date);
};

const validarHora = (hora: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);

export class VeterinariaService {
  async crearMascota(input: MascotaInput, duenioUid: string) {
    if (!input.nombre?.trim() || !input.especie?.trim() || !input.raza?.trim() || typeof input.edad !== "number") {
      throw new AppError("Datos invalidos para crear mascota", 400);
    }

    const payload = {
      nombre: input.nombre.trim(),
      especie: input.especie.trim(),
      raza: input.raza.trim(),
      edad: input.edad,
      fotoUrl: input.fotoUrl ?? null,
      duenioUid,
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("mascotas").add(payload);
    return { id: docRef.id, ...payload };
  }

  async obtenerHistorialMascota(mascotaId: string, requesterUid: string, requesterRole: string) {
    const mascotaRef = db.collection("mascotas").doc(mascotaId);
    const mascotaDoc = await mascotaRef.get();

    if (!mascotaDoc.exists) {
      throw new AppError("Mascota no encontrada", 404);
    }

    const mascota = mascotaDoc.data()!;
    if (requesterRole === "dueno" && mascota.duenioUid !== requesterUid) {
      throw new AppError("No tiene permisos para ver este historial", 403);
    }

    const historialSnapshot = await db
      .collection("atencionesmedicas")
      .where("mascotaId", "==", mascotaId)
      .orderBy("fecha", "desc")
      .get();

    return historialSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async registrarAtencion(mascotaId: string, veterinarioUid: string, input: AtencionInput) {
    if (!input.diagnostico?.trim() || !input.tratamiento?.trim() || !input.fecha) {
      throw new AppError("Datos clinicos incompletos", 400);
    }

    const mascotaDoc = await db.collection("mascotas").doc(mascotaId).get();
    if (!mascotaDoc.exists) {
      throw new AppError("Mascota no encontrada", 404);
    }

    const payload = {
      mascotaId,
      veterinarioUid,
      diagnostico: input.diagnostico.trim(),
      tratamiento: input.tratamiento.trim(),
      fecha: parseFecha(input.fecha),
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("atencionesmedicas").add(payload);
    return { id: docRef.id, ...payload };
  }

  async obtenerAgenda() {
    const snapshot = await db
      .collection("citas")
      .where("estado", "in", CITAS_OCUPADAS)
      .orderBy("fecha", "asc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async crearCita(input: CitaInput, duenioUid: string) {
    if (!input.mascotaId || !input.fecha || !input.hora || !validarHora(input.hora)) {
      throw new AppError("Datos invalidos para agendar cita", 400);
    }

    const mascotaRef = db.collection("mascotas").doc(input.mascotaId);
    const mascotaDoc = await mascotaRef.get();

    if (!mascotaDoc.exists) {
      throw new AppError("Mascota no encontrada", 404);
    }

    const mascota = mascotaDoc.data()!;
    if (mascota.duenioUid !== duenioUid) {
      throw new AppError("Solo el duenio puede agendar para esta mascota", 403);
    }

    const fecha = parseFecha(input.fecha);

    const citaCreada = await db.runTransaction(async (transaction) => {
      const disponibilidadQuery = db
        .collection("citas")
        .where("fecha", "==", fecha)
        .where("hora", "==", input.hora)
        .where("estado", "in", CITAS_OCUPADAS);

      const disponibilidadSnapshot = await transaction.get(disponibilidadQuery);
      if (!disponibilidadSnapshot.empty) {
        throw new AppError("El horario solicitado ya esta ocupado", 409);
      }

      const citaRef = db.collection("citas").doc();
      const payload = {
        mascotaId: input.mascotaId,
        duenioUid,
        fecha,
        hora: input.hora,
        estado: "pendiente" as CitaEstado,
        creadoEn: Timestamp.now()
      };

      transaction.set(citaRef, payload);
      return { id: citaRef.id, ...payload };
    });

    return citaCreada;
  }
}

export const veterinariaService = new VeterinariaService();
