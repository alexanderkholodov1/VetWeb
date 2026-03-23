import { Router } from "express";
import { requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { comunidadService } from "./comunidad.service";

export const comunidadRouter = Router();

comunidadRouter.post(
  "/campanas",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const campana = await comunidadService.crearCampana(req.body, req.user!.uid);
    res.status(201).json(campana);
  })
);

comunidadRouter.get(
  "/campanas",
  requireRole("ciudadano", "voluntario", "dueno", "administrador"),
  asyncHandler(async (_req, res) => {
    const campanas = await comunidadService.listarCampanasActivas();
    res.json(campanas);
  })
);

comunidadRouter.post(
  "/campanas/:id/inscripciones",
  requireRole("ciudadano", "voluntario", "dueno"),
  asyncHandler(async (req, res) => {
    const inscripcion = await comunidadService.crearInscripcion(req.params.id, req.user!.uid);
    res.status(201).json(inscripcion);
  })
);

comunidadRouter.get(
  "/campanas/:id/inscripciones",
  requireRole("administrador"),
  asyncHandler(async (req, res) => {
    const inscripciones = await comunidadService.listarInscripciones(req.params.id);
    res.json(inscripciones);
  })
);
