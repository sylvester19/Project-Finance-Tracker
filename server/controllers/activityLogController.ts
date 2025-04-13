// server/controllers/activityLogController.ts

import { Request, Response } from "express";
import { activityLogService } from "../services/activityLogService";

export const activityLogController = {
  async getActivityLog(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const log = await activityLogService.getActivityLog(id);

      if (!log) {
        return res.status(404).json({ message: "Activity log not found" });
      }

      res.json(log);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get activity log" });
    }
  },

  async getActivityLogs(req: Request, res: Response) {
    try {
      const logs = await activityLogService.getActivityLogs();
      res.json(logs);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  },

  async getActivityLogsByProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const logs = await activityLogService.getActivityLogsByProject(projectId);
      res.json(logs);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get activity logs by project" });
    }
  },

  async getActivityLogsByUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const logs = await activityLogService.getActivityLogsByUser(userId);
      res.json(logs);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get activity logs by user" });
    }
  },

  async createActivityLog(req: Request, res: Response) {
    try {
      const newLog = await activityLogService.createActivityLog(req.body);
      res.status(201).json(newLog);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },
};