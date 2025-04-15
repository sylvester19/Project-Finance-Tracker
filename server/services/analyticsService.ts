// server/services/analyticsService.ts

import { SpendingCategory } from "@shared/schema";
import { storage } from "../storage";

export const analyticsService = {
  async getTotalBudgetVsSpent(): Promise<{ project: string; budget: number; spent: number }[]> {
    return storage.getTotalBudgetVsSpent();
  },

  async getMonthlySpendingTrends(): Promise<{ month: string; equipment: number; labor: number; transport: number }[]> {
    return storage.getMonthlySpendingTrends();
  },

  async getSpendingByCategory(): Promise<SpendingCategory[]> {
    return storage.getSpendingByCategory();
  },

  async getExpenseApprovalRates(): Promise<{ status: string; count: number }[]> {
    return storage.getExpenseApprovalRates();
  },

  async getSpendingByEmployee(): Promise<{ employee: string; amount: number }[]> {
    return storage.getSpendingByEmployee();
  },
};