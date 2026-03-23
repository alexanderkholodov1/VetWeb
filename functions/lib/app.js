"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const rescate_router_1 = require("./modules/rescate/rescate.router");
const veterinaria_router_1 = require("./modules/veterinaria/veterinaria.router");
const donaciones_router_1 = require("./modules/donaciones/donaciones.router");
const administracion_router_1 = require("./modules/administracion/administracion.router");
const comunidad_router_1 = require("./modules/comunidad/comunidad.router");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use(auth_middleware_1.authenticate);
exports.app.use("/rescate", rescate_router_1.rescateRouter);
exports.app.use("/veterinaria", veterinaria_router_1.veterinariaRouter);
exports.app.use("/donaciones", donaciones_router_1.donacionesRouter);
exports.app.use("/admin", administracion_router_1.administracionRouter);
exports.app.use("/comunidad", comunidad_router_1.comunidadRouter);
exports.app.use(error_middleware_1.notFoundHandler);
exports.app.use(error_middleware_1.errorHandler);
//# sourceMappingURL=app.js.map