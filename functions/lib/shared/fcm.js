"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fcmService = exports.FcmService = void 0;
const firestore_1 = require("./firestore");
class FcmService {
    async sendToToken(token, title, body) {
        if (!token) {
            return;
        }
        await firestore_1.messaging.send({
            token,
            notification: { title, body }
        });
    }
    async broadcastToUsers(title, body) {
        const usersSnapshot = await firestore_1.db.collection("usuarios").where("fcmToken", "!=", "").get();
        const tokens = usersSnapshot.docs
            .map((doc) => doc.data().fcmToken)
            .filter((token) => Boolean(token));
        if (!tokens.length) {
            return;
        }
        await firestore_1.messaging.sendEachForMulticast({
            tokens,
            notification: { title, body }
        });
    }
}
exports.FcmService = FcmService;
exports.fcmService = new FcmService();
//# sourceMappingURL=fcm.js.map