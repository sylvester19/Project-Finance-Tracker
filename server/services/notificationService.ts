// server/services/notificationService.ts
import { storage } from "../storage";

export const notificationService = {
  async getUnreadNotifications(userId: number) {
    try {
      return await storage.getUnreadNotifications(userId);
    } catch (error) {
      console.error("Error fetching unread notifications from storage:", error);
      throw new Error("Failed to fetch unread notifications");
    }
  }
};