"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donacionesRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const async_handler_1 = require("../../shared/async-handler");
const donaciones_service_1 = require("./donaciones.service");
exports.donacionesRouter = (0, express_1.Router)();
exports.donacionesRouter.post("/", (0, auth_middleware_1.requireRole)("donante"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const donacion = await donaciones_service_1.donacionesService.crearDonacion(req.body, req.user.uid, req.user?.fcmToken);
    res.status(201).json(donacion);
}));
exports.donacionesRouter.post("/apadrinamientos", (0, auth_middleware_1.requireRole)("donante"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const apadrinamiento = await donaciones_service_1.donacionesService.crearApadrinamiento(req.body, req.user.uid, req.user?.fcmToken);
    res.status(201).json(apadrinamiento);
}));
exports.donacionesRouter.get("/", (0, auth_middleware_1.requireRole)("administrador"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const donaciones = await donaciones_service_1.donacionesService.listarDonaciones();
    res.json(donaciones);
}));
//# sourceMappingURL=donaciones.router.js.map