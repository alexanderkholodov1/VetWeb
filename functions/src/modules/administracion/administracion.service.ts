import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../shared/firestore";
import { AppError } from "../../middleware/error.middleware";
import { UserRole } from "./administracion.types";

const ROLES_VALIDOS: UserRole[] = ["ciudadano", "dueno", "veterinario", "voluntario", "administrador", "donante"];

export class AdministracionService {
  async listarUsuarios(rol?: string) {
    let query: FirebaseFirestore.Query = db.collection("usuarios").orderBy("creadoEn", "desc");

    if (rol) {
      if (!ROLES_VALIDOS.includes(rol as UserRole)) {
        throw new AppError("Rol invalido", 400);
      }
      query = query.where("rol", "==", rol);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  }

  async actualizarRol(uid: string, rol: string) {
    if (!ROLES_VALIDOS.includes(rol as UserRole)) {
      throw new AppError("Rol invalido", 400);
    }

    const userRef = db.collection("usuarios").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError("Usuario no encontrado", 404);
    }

    await userRef.update({ rol });
    return { uid, rol };
  }

  async reportePorSector() {
    const snapshot = await db.collection("reportes").get();
    const conteo = new Map<string, number>();

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
    const snapshot = await db.collection("reportes").orderBy("creadoEn", "desc").get();
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
    const snapshot = await db.collection("suministros").orderBy("nombre", "asc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async crearOActualizarSuministro(input: { nombre: string; cantidad: number; unidad: string }) {
    if (!input.nombre?.trim() || typeof input.cantidad !== "number" || !input.unidad?.trim()) {
      throw new AppError("Datos invalidos para suministro", 400);
    }

    const existing = await db.collection("suministros").where("nombre", "==", input.nombre.trim()).limit(1).get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      await doc.ref.update({
        cantidad: input.cantidad,
        unidad: input.unidad.trim(),
        actualizadoEn: Timestamp.now()
      });
      return { id: doc.id, ...doc.data(), cantidad: input.cantidad, unidad: input.unidad.trim() };
    }

    const payload = {
      nombre: input.nombre.trim(),
      cantidad: input.cantidad,
      unidad: input.unidad.trim(),
      actualizadoEn: Timestamp.now()
    };

    const docRef = await db.collection("suministros").add(payload);
    return { id: docRef.id, ...payload };
  }
}

export const administracionService = new AdministracionService();
