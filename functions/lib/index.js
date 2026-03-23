"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("./app");
exports.api = (0, https_1.onRequest)({
    cors: true,
    region: "southamerica-east1"
}, app_1.app);
//# sourceMappingURL=index.js.map