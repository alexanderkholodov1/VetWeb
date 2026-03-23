import express from "express";
import { authenticate } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { rescateRouter } from "./modules/rescate/rescate.router";
import { veterinariaRouter } from "./modules/veterinaria/veterinaria.router";
import { donacionesRouter } from "./modules/donaciones/donaciones.router";
import { administracionRouter } from "./modules/administracion/administracion.router";
import { comunidadRouter } from "./modules/comunidad/comunidad.router";

export const app = express();

app.use(express.json());
app.use(authenticate);

app.use("/rescate", rescateRouter);
app.use("/veterinaria", veterinariaRouter);
app.use("/donaciones", donacionesRouter);
app.use("/admin", administracionRouter);
app.use("/comunidad", comunidadRouter);

app.use(notFoundHandler);
app.use(errorHandler);
