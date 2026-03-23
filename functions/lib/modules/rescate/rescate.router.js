"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescateRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const async_handler_1 = require("../../shared/async-handler");
const rescate_service_1 = require("./rescate.service");
exports.rescateRouter = (0, express_1.Router)();
exports.rescateRouter.post("/reportes", (0, auth_middleware_1.requireRole)("ciudadano", "voluntario"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const reporte = await rescate_service_1.rescateService.crearReporte(req.body, req.user.uid);
    res.status(201).json(reporte);
}));
exports.rescateRouter.get("/reportes", (0, auth_middleware_1.requireRole)("ciudadano", "voluntario", "administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const reportes = await rescate_service_1.rescateService.listarReportes({
        estado: req.query.estado,
        limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    res.json(reportes);
}));
exports.rescateRouter.patch("/reportes/:id", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const response = await rescate_service_1.rescateService.actualizarEstado(req.params.id, req.body.estado);
    res.json(response);
}));
//# sourceMappingURL=rescate.router.js.map