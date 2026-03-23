import { Router } from "express";
import { requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { rescateService } from "./rescate.service";

export const rescateRouter = Router();

rescateRouter.post(
  "/reportes",
  requireRole("ciudadano", "voluntario"),
  asyncHandler(async (req, res) => {
    const reporte = await rescateService.crearReporte(req.body, req.user!.uid);
    res.status(201).json(reporte);
  })
);

rescateRouter.get(
  "/reportes",
  requireRole("ciudadano", "voluntario", "administrador"),
  asyncHandler(async (req, res) => {
    const reportes = await rescateService.listarReportes({
      estado: req.query.estado as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    res.json(reportes);
  })
);

rescateRouter.patch(
  "/reportes/:id",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const response = await rescateService.actualizarEstado(req.params.id, req.body.estado);
    res.json(response);
  })
);
