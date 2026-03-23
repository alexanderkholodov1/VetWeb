"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.administracionService = exports.AdministracionService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../shared/firestore");
const error_middleware_1 = require("../../middleware/error.middleware");
const ROLES_VALIDOS = [
    "user",
    "staff",
    "admin",
    "ciudadano",
    "dueno",
    "veterinario",
    "voluntario",
    "administrador",
    "donante"
];
class AdministracionService {
    async listarUsuarios(rol) {
        let query = firestore_2.db.collection("usuarios").orderBy("creadoEn", "desc");
        if (rol) {
            if (!ROLES_VALIDOS.includes(rol)) {
                throw new error_middleware_1.AppError("Rol invalido", 400);
            }
            query = query.where("rol", "==", rol);
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    }
    async actualizarRol(uid, rol) {
        if (!ROLES_VALIDOS.includes(rol)) {
            throw new error_middleware_1.AppError("Rol invalido", 400);
        }
        const userRef = firestore_2.db.collection("usuarios").doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new error_middleware_1.AppError("Usuario no encontrado", 404);
        }
        await userRef.update({ rol });
        return { uid, rol };
    }
    async reportePorSector() {
        const snapshot = await firestore_2.db.collection("reportes").get();
        const conteo = new Map();
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const lat = Number(data.ubicacion?.lat);
            const lng = Number(data.ubicacion?.lng);
            if (Number.isNaN(lat) || Number.isNaN(lng)) {
                return;
            }
            const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
            conteo.set(key, (conteo.get(key) ?? 0) + 1);
        });
        return Array.from(conteo.entries()).map(([sector, cantidad]) => ({ sector, cantidad }));
    }
    async mapaAbandono() {
        const snapshot = await firestore_2.db.collection("reportes").orderBy("creadoEn", "desc").get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                descripcion: data.descripcion,
                estado: data.estado,
                ubicacion: data.ubicacion,
                creadoEn: data.creadoEn
            };
        });
    }
    async listarSuministros() {
        const snapshot = await firestore_2.db.collection("suministros").orderBy("nombre", "asc").get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    async crearOActualizarSuministro(input) {
        if (!input.nombre?.trim() || typeof input.cantidad !== "number" || !input.unidad?.trim()) {
            throw new error_middleware_1.AppError("Datos invalidos para suministro", 400);
        }
        const existing = await firestore_2.db.collection("suministros").where("nombre", "==", input.nombre.trim()).limit(1).get();
        if (!existing.empty) {
            const doc = existing.docs[0];
            await doc.ref.update({
                cantidad: input.cantidad,
                unidad: input.unidad.trim(),
                actualizadoEn: firestore_1.Timestamp.now()
            });
            return { id: doc.id, ...doc.data(), cantidad: input.cantidad, unidad: input.unidad.trim() };
        }
        const payload = {
            nombre: input.nombre.trim(),
            cantidad: input.cantidad,
            unidad: input.unidad.trim(),
            actualizadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("suministros").add(payload);
        return { id: docRef.id, ...payload };
    }
}
exports.AdministracionService = AdministracionService;
exports.administracionService = new AdministracionService();
//# sourceMappingURL=administracion.service.js.map