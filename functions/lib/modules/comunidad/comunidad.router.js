"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comunidadRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const async_handler_1 = require("../../shared/async-handler");
const comunidad_service_1 = require("./comunidad.service");
exports.comunidadRouter = (0, express_1.Router)();
exports.comunidadRouter.post("/campanas", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const campana = await comunidad_service_1.comunidadService.crearCampana(req.body, req.user.uid);
    res.status(201).json(campana);
}));
exports.comunidadRouter.get("/campanas", (0, auth_middleware_1.requireRole)("ciudadano", "voluntario", "dueno", "administrador"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const campanas = await comunidad_service_1.comunidadService.listarCampanasActivas();
    res.json(campanas);
}));
exports.comunidadRouter.post("/campanas/:id/inscripciones", (0, auth_middleware_1.requireRole)("ciudadano", "voluntario", "dueno"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const inscripcion = await comunidad_service_1.comunidadService.crearInscripcion(req.params.id, req.user.uid);
    res.status(201).json(inscripcion);
}));
exports.comunidadRouter.get("/campanas/:id/inscripciones", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const inscripciones = await comunidad_service_1.comunidadService.listarInscripciones(req.params.id);
    res.json(inscripciones);
}));
//# sourceMappingURL=comunidad.router.js.map