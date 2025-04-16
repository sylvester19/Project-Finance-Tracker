// server/controllers/notificationController.ts
import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';

export const notificationController = {
  async getUnreadNotifications(req: Request, res: Response) {
    try {
      const userId = parseInt(req.query.userId as string); 
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }
      const notifications = await notificationService.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  }
};