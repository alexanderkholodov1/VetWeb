import { Router } from "express";
import { requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { administracionService } from "./administracion.service";

export const administracionRouter = Router();

administracionRouter.get(
  "/usuarios",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const usuarios = await administracionService.listarUsuarios(req.query.rol as string | undefined);
    res.json(usuarios);
  })
);

administracionRouter.patch(
  "/usuarios/:uid/rol",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const usuario = await administracionService.actualizarRol(req.params.uid, req.body.rol);
    res.json(usuario);
  })
);

administracionRouter.get(
  "/reportes/sector",
  requireRole("administrador"),
  asyncHandler(async (_req, res) => {
    const data = await administracionService.reportePorSector();
    res.json(data);
  })
);

administracionRouter.get(
  "/mapa-abandono",
  requireRole("administrador"),
  asyncHandler(async (_req, res) => {
    const data = await administracionService.mapaAbandono();
    res.json(data);
  })
);

administracionRouter.get(
  "/suministros",
  requireRole("administrador"),
  asyncHandler(async (_req, res) => {
    const data = await administracionService.listarSuministros();
    res.json(data);
  })
);

administracionRouter.post(
  "/suministros",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const data = await administracionService.crearOActualizarSuministro(req.body);
    res.status(201).json(data);
  })
);
