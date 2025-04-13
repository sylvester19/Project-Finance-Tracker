// server/controllers/analyticsController.ts

import { Request, Response } from "express";
import { analyticsService } from "../services/analyticsService";

export const analyticsController = {
  async getTotalBudgetVsSpent(req: Request, res: Response) {
    try {
      const data = await analyticsService.getTotalBudgetVsSpent();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get total budget vs spent data" });
    }
  },

  async getMonthlySpendingTrends(req: Request, res: Response) {
    try {
      const data = await analyticsService.getMonthlySpendingTrends();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get monthly spending trends data" });
    }
  },

  async getSpendingByCategory(req: Request, res: Response) {
    try {
      const data = await analyticsService.getSpendingByCategory();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get spending by category data" });
    }
  },

  async getExpenseApprovalRates(req: Request, res: Response) {
    try {
      const data = await analyticsService.getExpenseApprovalRates();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expense approval rates data" });
    }
  },

  async getSpendingByEmployee(req: Request, res: Response) {
    try {
      const data = await analyticsService.getSpendingByEmployee();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get spending by employee data" });
    }
  },
};