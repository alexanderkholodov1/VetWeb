import { onRequest } from "firebase-functions/v2/https";
import { app } from "./app";

export const api = onRequest(
  {
    cors: true,
    region: "southamerica-east1"
  },
  app
);
