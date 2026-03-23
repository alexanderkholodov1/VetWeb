"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.administracionRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const async_handler_1 = require("../../shared/async-handler");
const administracion_service_1 = require("./administracion.service");
exports.administracionRouter = (0, express_1.Router)();
exports.administracionRouter.get("/usuarios", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const usuarios = await administracion_service_1.administracionService.listarUsuarios(req.query.rol);
    res.json(usuarios);
}));
exports.administracionRouter.patch("/usuarios/:uid/rol", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const usuario = await administracion_service_1.administracionService.actualizarRol(req.params.uid, req.body.rol);
    res.json(usuario);
}));
exports.administracionRouter.get("/reportes/sector", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await administracion_service_1.administracionService.reportePorSector();
    res.json(data);
}));
exports.administracionRouter.get("/mapa-abandono", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await administracion_service_1.administracionService.mapaAbandono();
    res.json(data);
}));
exports.administracionRouter.get("/suministros", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await administracion_service_1.administracionService.listarSuministros();
    res.json(data);
}));
exports.administracionRouter.post("/suministros", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await administracion_service_1.administracionService.crearOActualizarSuministro(req.body);
    res.status(201).json(data);
}));
//# sourceMappingURL=administracion.router.js.map