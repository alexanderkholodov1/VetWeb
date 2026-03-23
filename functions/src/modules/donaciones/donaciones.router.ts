import { Router } from "express";
import { requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { donacionesService } from "./donaciones.service";

export const donacionesRouter = Router();

donacionesRouter.post(
  "/",
  requireRole("donante"),
  asyncHandler(async (req, res) => {
    const donacion = await donacionesService.crearDonacion(req.body, req.user!.uid, req.user?.fcmToken);
    res.status(201).json(donacion);
  })
);

donacionesRouter.post(
  "/apadrinamientos",
  requireRole("donante"),
  asyncHandler(async (req, res) => {
    const apadrinamiento = await donacionesService.crearApadrinamiento(req.body, req.user!.uid, req.user?.fcmToken);
    res.status(201).json(apadrinamiento);
  })
);

donacionesRouter.get(
  "/",
  requireRole("administrador"),
  asyncHandler(async (_req, res) => {
    const donaciones = await donacionesService.listarDonaciones();
    res.json(donaciones);
  })
);
