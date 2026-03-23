import { Router } from "express";
import { requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { veterinariaService } from "./veterinaria.service";

export const veterinariaRouter = Router();

veterinariaRouter.post(
  "/mascotas",
  requireRole("dueno"),
  asyncHandler(async (req, res) => {
    const response = await veterinariaService.crearMascota(req.body, req.user!.uid);
    res.status(201).json(response);
  })
);

veterinariaRouter.get(
  "/mascotas/:id/historial",
  requireRole("veterinario", "dueno"),
  asyncHandler(async (req, res) => {
    const data = await veterinariaService.obtenerHistorialMascota(req.params.id, req.user!.uid, req.user!.role!);
    res.json(data);
  })
);

veterinariaRouter.post(
  "/mascotas/:id/atenciones",
  requireRole("veterinario"),
  asyncHandler(async (req, res) => {
    const data = await veterinariaService.registrarAtencion(req.params.id, req.user!.uid, req.body);
    res.status(201).json(data);
  })
);

veterinariaRouter.get(
  "/agenda",
  requireRole("veterinario"),
  asyncHandler(async (_req, res) => {
    const data = await veterinariaService.obtenerAgenda();
    res.json(data);
  })
);

veterinariaRouter.post(
  "/citas",
  requireRole("dueno"),
  asyncHandler(async (req, res) => {
    const data = await veterinariaService.crearCita(req.body, req.user!.uid);
    res.status(201).json(data);
  })
);
