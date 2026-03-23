"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comunidadService = exports.ComunidadService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../shared/firestore");
const fcm_1 = require("../../shared/fcm");
const error_middleware_1 = require("../../middleware/error.middleware");
const parseFecha = (fecha) => {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        throw new error_middleware_1.AppError("Fecha invalida", 400);
    }
    return firestore_1.Timestamp.fromDate(date);
};
class ComunidadService {
    async crearCampana(input, creadoPorUid) {
        if (!input.titulo?.trim() || !input.descripcion?.trim() || !input.fechaInicio || !input.fechaFin) {
            throw new error_middleware_1.AppError("Campos obligatorios incompletos", 400);
        }
        const fechaInicio = parseFecha(input.fechaInicio);
        const fechaFin = parseFecha(input.fechaFin);
        if (fechaInicio.toMillis() > fechaFin.toMillis()) {
            throw new error_middleware_1.AppError("fechaInicio debe ser menor o igual a fechaFin", 400);
        }
        const payload = {
            titulo: input.titulo.trim(),
            descripcion: input.descripcion.trim(),
            fechaInicio,
            fechaFin,
            creadoPorUid,
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("campanas").add(payload);
        await fcm_1.fcmService.broadcastToUsers("Nueva campana activa", payload.titulo);
        return { id: docRef.id, ...payload };
    }
    async listarCampanasActivas() {
        const now = firestore_1.Timestamp.now();
        const snapshot = await firestore_2.db.collection("campanas").where("fechaFin", ">=", now).orderBy("fechaFin", "asc").get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    async crearInscripcion(campanaId, usuarioUid) {
        const campanaDoc = await firestore_2.db.collection("campanas").doc(campanaId).get();
        if (!campanaDoc.exists) {
            throw new error_middleware_1.AppError("Campana no encontrada", 404);
        }
        const existing = await firestore_2.db
            .collection("inscripciones")
            .where("campanaId", "==", campanaId)
            .where("usuarioUid", "==", usuarioUid)
            .limit(1)
            .get();
        if (!existing.empty) {
            throw new error_middleware_1.AppError("El usuario ya esta inscrito en esta campana", 409);
        }
        const payload = {
            campanaId,
            usuarioUid,
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("inscripciones").add(payload);
        return { id: docRef.id, ...payload };
    }
    async listarInscripciones(campanaId) {
        const campanaDoc = await firestore_2.db.collection("campanas").doc(campanaId).get();
        if (!campanaDoc.exists) {
            throw new error_middleware_1.AppError("Campana no encontrada", 404);
        }
        const snapshot = await firestore_2.db.collection("inscripciones").where("campanaId", "==", campanaId).get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
}
exports.ComunidadService = ComunidadService;
exports.comunidadService = new ComunidadService();
//# sourceMappingURL=comunidad.service.js.map