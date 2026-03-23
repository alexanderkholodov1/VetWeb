"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veterinariaService = exports.VeterinariaService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../shared/firestore");
const error_middleware_1 = require("../../middleware/error.middleware");
const CITAS_OCUPADAS = ["pendiente", "confirmada"];
const parseFecha = (fecha) => {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        throw new error_middleware_1.AppError("Fecha invalida", 400);
    }
    return firestore_1.Timestamp.fromDate(date);
};
const validarHora = (hora) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
class VeterinariaService {
    async crearMascota(input, duenioUid) {
        if (!input.nombre?.trim() || !input.especie?.trim() || !input.raza?.trim() || typeof input.edad !== "number") {
            throw new error_middleware_1.AppError("Datos invalidos para crear mascota", 400);
        }
        const payload = {
            nombre: input.nombre.trim(),
            especie: input.especie.trim(),
            raza: input.raza.trim(),
            edad: input.edad,
            fotoUrl: input.fotoUrl ?? null,
            duenioUid,
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("mascotas").add(payload);
        return { id: docRef.id, ...payload };
    }
    async obtenerHistorialMascota(mascotaId, requesterUid, requesterRole) {
        const mascotaRef = firestore_2.db.collection("mascotas").doc(mascotaId);
        const mascotaDoc = await mascotaRef.get();
        if (!mascotaDoc.exists) {
            throw new error_middleware_1.AppError("Mascota no encontrada", 404);
        }
        const mascota = mascotaDoc.data();
        if ((requesterRole === "dueno" || requesterRole === "user") && mascota.duenioUid !== requesterUid) {
            throw new error_middleware_1.AppError("No tiene permisos para ver este historial", 403);
        }
        const historialSnapshot = await firestore_2.db
            .collection("atencionesmedicas")
            .where("mascotaId", "==", mascotaId)
            .orderBy("fecha", "desc")
            .get();
        return historialSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    async registrarAtencion(mascotaId, veterinarioUid, input) {
        if (!input.diagnostico?.trim() || !input.tratamiento?.trim() || !input.fecha) {
            throw new error_middleware_1.AppError("Datos clinicos incompletos", 400);
        }
        const mascotaDoc = await firestore_2.db.collection("mascotas").doc(mascotaId).get();
        if (!mascotaDoc.exists) {
            throw new error_middleware_1.AppError("Mascota no encontrada", 404);
        }
        const payload = {
            mascotaId,
            veterinarioUid,
            diagnostico: input.diagnostico.trim(),
            tratamiento: input.tratamiento.trim(),
            fecha: parseFecha(input.fecha),
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("atencionesmedicas").add(payload);
        return { id: docRef.id, ...payload };
    }
    async obtenerAgenda() {
        const snapshot = await firestore_2.db
            .collection("citas")
            .where("estado", "in", CITAS_OCUPADAS)
            .orderBy("fecha", "asc")
            .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    async crearCita(input, duenioUid) {
        if (!input.mascotaId || !input.fecha || !input.hora || !validarHora(input.hora)) {
            throw new error_middleware_1.AppError("Datos invalidos para agendar cita", 400);
        }
        const mascotaRef = firestore_2.db.collection("mascotas").doc(input.mascotaId);
        const mascotaDoc = await mascotaRef.get();
        if (!mascotaDoc.exists) {
            throw new error_middleware_1.AppError("Mascota no encontrada", 404);
        }
        const mascota = mascotaDoc.data();
        if (mascota.duenioUid !== duenioUid) {
            throw new error_middleware_1.AppError("Solo el duenio puede agendar para esta mascota", 403);
        }
        const fecha = parseFecha(input.fecha);
        const citaCreada = await firestore_2.db.runTransaction(async (transaction) => {
            const disponibilidadQuery = firestore_2.db
                .collection("citas")
                .where("fecha", "==", fecha)
                .where("hora", "==", input.hora)
                .where("estado", "in", CITAS_OCUPADAS);
            const disponibilidadSnapshot = await transaction.get(disponibilidadQuery);
            if (!disponibilidadSnapshot.empty) {
                throw new error_middleware_1.AppError("El horario solicitado ya esta ocupado", 409);
            }
            const citaRef = firestore_2.db.collection("citas").doc();
            const payload = {
                mascotaId: input.mascotaId,
                duenioUid,
                fecha,
                hora: input.hora,
                estado: "pendiente",
                creadoEn: firestore_1.Timestamp.now()
            };
            transaction.set(citaRef, payload);
            return { id: citaRef.id, ...payload };
        });
        return citaCreada;
    }
}
exports.VeterinariaService = VeterinariaService;
exports.veterinariaService = new VeterinariaService();
//# sourceMappingURL=veterinaria.service.js.map