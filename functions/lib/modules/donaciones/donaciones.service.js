"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donacionesService = exports.DonacionesService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../shared/firestore");
const fcm_1 = require("../../shared/fcm");
const payment_service_1 = require("../../shared/payment.service");
const error_middleware_1 = require("../../middleware/error.middleware");
class DonacionesService {
    async crearDonacion(input, donorUid, donorToken) {
        if (typeof input.monto !== "number" || input.monto <= 0 || !input.metodoPago?.trim()) {
            throw new error_middleware_1.AppError("Datos invalidos para donacion", 400);
        }
        const paymentResult = await payment_service_1.paymentService.procesarPago({
            monto: input.monto,
            metodo: input.metodoPago,
            descripcion: "Donacion plataforma rescate"
        });
        const payload = {
            donorUid,
            monto: input.monto,
            metodoPago: input.metodoPago.trim(),
            pagoId: paymentResult.pagoId,
            estado: paymentResult.success ? "exitosa" : "fallida",
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("donaciones").add(payload);
        if (!paymentResult.success) {
            throw new error_middleware_1.AppError(paymentResult.error ?? "No se pudo procesar el pago", 402);
        }
        if (donorToken) {
            await fcm_1.fcmService.sendToToken(donorToken, "Donacion recibida", `Gracias por donar $${input.monto.toFixed(2)}.`);
        }
        return { id: docRef.id, ...payload };
    }
    async crearApadrinamiento(input, padrinoUid, donorToken) {
        if (!input.animalId || typeof input.montoMensual !== "number" || input.montoMensual <= 0 || !input.metodoPago?.trim()) {
            throw new error_middleware_1.AppError("Datos invalidos para apadrinamiento", 400);
        }
        const animalDoc = await firestore_2.db.collection("mascotas").doc(input.animalId).get();
        if (!animalDoc.exists) {
            throw new error_middleware_1.AppError("Animal no encontrado", 404);
        }
        const apadrinamientoActivo = await firestore_2.db
            .collection("apadrinamientos")
            .where("animalId", "==", input.animalId)
            .where("estado", "==", "activo")
            .limit(1)
            .get();
        if (!apadrinamientoActivo.empty) {
            throw new error_middleware_1.AppError("El animal ya tiene un apadrinamiento activo", 409);
        }
        const paymentResult = await payment_service_1.paymentService.procesarPago({
            monto: input.montoMensual,
            metodo: input.metodoPago,
            descripcion: `Apadrinamiento animal ${input.animalId}`
        });
        if (!paymentResult.success || !paymentResult.pagoId) {
            throw new error_middleware_1.AppError(paymentResult.error ?? "Pago rechazado", 402);
        }
        const payload = {
            animalId: input.animalId,
            padrinoUid,
            montoMensual: input.montoMensual,
            estado: "activo",
            pagoId: paymentResult.pagoId,
            creadoEn: firestore_1.Timestamp.now()
        };
        const docRef = await firestore_2.db.collection("apadrinamientos").add(payload);
        if (donorToken) {
            await fcm_1.fcmService.sendToToken(donorToken, "Apadrinamiento activo", `Tu apadrinamiento mensual de $${input.montoMensual.toFixed(2)} fue registrado.`);
        }
        return { id: docRef.id, ...payload };
    }
    async listarDonaciones() {
        const snapshot = await firestore_2.db.collection("donaciones").orderBy("creadoEn", "desc").get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
}
exports.DonacionesService = DonacionesService;
exports.donacionesService = new DonacionesService();
//# sourceMappingURL=donaciones.service.js.map