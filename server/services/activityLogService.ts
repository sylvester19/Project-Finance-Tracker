// server/services/activityLogService.ts

import { storage } from "../storage";
import { ActivityLog, InsertActivityLog } from "@shared/schema";

export const activityLogService = {
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return storage.getActivityLog(id);
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    return storage.getActivityLogs();
  },

  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    return storage.getActivityLogsByProject(projectId);
  },

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return storage.getActivityLogsByUser(userId);
  },

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    // Add any business logic or validation here before creating the activity log
    return storage.createActivityLog(log);
  },
};