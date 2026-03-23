"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veterinariaRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const async_handler_1 = require("../../shared/async-handler");
const veterinaria_service_1 = require("./veterinaria.service");
exports.veterinariaRouter = (0, express_1.Router)();
exports.veterinariaRouter.post("/mascotas", (0, auth_middleware_1.requireRole)("dueno"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const response = await veterinaria_service_1.veterinariaService.crearMascota(req.body, req.user.uid);
    res.status(201).json(response);
}));
exports.veterinariaRouter.get("/mascotas/:id/historial", (0, auth_middleware_1.requireRole)("veterinario", "dueno"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await veterinaria_service_1.veterinariaService.obtenerHistorialMascota(req.params.id, req.user.uid, req.user.role);
    res.json(data);
}));
exports.veterinariaRouter.post("/mascotas/:id/atenciones", (0, auth_middleware_1.requireRole)("veterinario"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await veterinaria_service_1.veterinariaService.registrarAtencion(req.params.id, req.user.uid, req.body);
    res.status(201).json(data);
}));
exports.veterinariaRouter.get("/agenda", (0, auth_middleware_1.requireRole)("veterinario"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await veterinaria_service_1.veterinariaService.obtenerAgenda();
    res.json(data);
}));
exports.veterinariaRouter.post("/citas", (0, auth_middleware_1.requireRole)("dueno"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await veterinaria_service_1.veterinariaService.crearCita(req.body, req.user.uid);
    res.status(201).json(data);
}));
//# sourceMappingURL=veterinaria.router.js.map