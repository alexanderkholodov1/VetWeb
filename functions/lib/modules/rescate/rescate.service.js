"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescateService = exports.RescateService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../shared/firestore");
const error_middleware_1 = require("../../middleware/error.middleware");
const REPORTES_COLLECTION = "reportes";
const ESTADOS_VALIDOS = ["pendiente", "en_proceso", "resuelto"];
class RescateService {
    async crearReporte(input, uid) {
        if (!input.descripcion?.trim() || typeof input.ubicacion?.lat !== "number" || typeof input.ubicacion?.lng !== "number") {
            throw new error_middleware_1.AppError("Campos obligatorios incompletos", 400);
        }
        const payload = {
            descripcion: input.descripcion.trim(),
            fotoUrl: input.fotoUrl ?? null,
            ubicacion: input.ubicacion,
            estado: "pendiente",
            reportadoPorUid: uid,
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection(REPORTES_COLLECTION).add(payload);
        return { id: docRef.id, ...payload };
    }
    async listarReportes(filters) {
        const { estado, limit } = filters;
        let query = firestore_2.db.collection(REPORTES_COLLECTION).orderBy("creadoEn", "desc");
        if (estado) {
            if (!ESTADOS_VALIDOS.includes(estado)) {
                throw new error_middleware_1.AppError("Estado de reporte invalido", 400);
            }
            query = query.where("estado", "==", estado);
        }
        if (limit && Number.isInteger(limit) && limit > 0) {
            query = query.limit(limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    async actualizarEstado(id, estado) {
        if (!ESTADOS_VALIDOS.includes(estado)) {
            throw new error_middleware_1.AppError("Estado de reporte invalido", 400);
        }
        const docRef = firestore_2.db.collection(REPORTES_COLLECTION).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new error_middleware_1.AppError("Reporte no encontrado", 404);
        }
        await docRef.update({ estado });
        return { id, estado };
    }
}
exports.RescateService = RescateService;
exports.rescateService = new RescateService();
//# sourceMappingURL=rescate.service.js.map