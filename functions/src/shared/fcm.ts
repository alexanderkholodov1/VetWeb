import { messaging, db } from "./firestore";

export class FcmService {
  async sendToToken(token: string, title: string, body: string): Promise<void> {
    if (!token) {
      return;
    }

    await messaging.send({
      token,
      notification: { title, body }
    });
  }

  async broadcastToUsers(title: string, body: string): Promise<void> {
    const usersSnapshot = await db.collection("usuarios").where("fcmToken", "!=", "").get();
    const tokens = usersSnapshot.docs
      .map((doc) => doc.data().fcmToken as string | undefined)
      .filter((token): token is string => Boolean(token));

    if (!tokens.length) {
      return;
    }

    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body }
    });
  }
}

export const fcmService = new FcmService();
