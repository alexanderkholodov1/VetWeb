import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../shared/firestore";
import { fcmService } from "../../shared/fcm";
import { paymentService } from "../../shared/payment.service";
import { AppError } from "../../middleware/error.middleware";
import { ApadrinamientoInput, DonacionInput } from "./donaciones.types";

export class DonacionesService {
  async crearDonacion(input: DonacionInput, donorUid: string, donorToken?: string) {
    if (typeof input.monto !== "number" || input.monto <= 0 || !input.metodoPago?.trim()) {
      throw new AppError("Datos invalidos para donacion", 400);
    }

    const paymentResult = await paymentService.procesarPago({
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
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("donaciones").add(payload);

    if (!paymentResult.success) {
      throw new AppError(paymentResult.error ?? "No se pudo procesar el pago", 402);
    }

    if (donorToken) {
      await fcmService.sendToToken(donorToken, "Donacion recibida", `Gracias por donar $${input.monto.toFixed(2)}.`);
    }

    return { id: docRef.id, ...payload };
  }

  async crearApadrinamiento(input: ApadrinamientoInput, padrinoUid: string, donorToken?: string) {
    if (!input.animalId || typeof input.montoMensual !== "number" || input.montoMensual <= 0 || !input.metodoPago?.trim()) {
      throw new AppError("Datos invalidos para apadrinamiento", 400);
    }

    const animalDoc = await db.collection("mascotas").doc(input.animalId).get();
    if (!animalDoc.exists) {
      throw new AppError("Animal no encontrado", 404);
    }

    const apadrinamientoActivo = await db
      .collection("apadrinamientos")
      .where("animalId", "==", input.animalId)
      .where("estado", "==", "activo")
      .limit(1)
      .get();

    if (!apadrinamientoActivo.empty) {
      throw new AppError("El animal ya tiene un apadrinamiento activo", 409);
    }

    const paymentResult = await paymentService.procesarPago({
      monto: input.montoMensual,
      metodo: input.metodoPago,
      descripcion: `Apadrinamiento animal ${input.animalId}`
    });

    if (!paymentResult.success || !paymentResult.pagoId) {
      throw new AppError(paymentResult.error ?? "Pago rechazado", 402);
    }

    const payload = {
      animalId: input.animalId,
      padrinoUid,
      montoMensual: input.montoMensual,
      estado: "activo",
      pagoId: paymentResult.pagoId,
      creadoEn: Timestamp.now()
    };

    const docRef = await db.collection("apadrinamientos").add(payload);

    if (donorToken) {
      await fcmService.sendToToken(
        donorToken,
        "Apadrinamiento activo",
        `Tu apadrinamiento mensual de $${input.montoMensual.toFixed(2)} fue registrado.`
      );
    }

    return { id: docRef.id, ...payload };
  }

  async listarDonaciones() {
    const snapshot = await db.collection("donaciones").orderBy("creadoEn", "desc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const donacionesService = new DonacionesService();
