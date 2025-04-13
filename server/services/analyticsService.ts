// server/services/analyticsService.ts

import { storage } from "../storage";

export const analyticsService = {
  async getTotalBudgetVsSpent(): Promise<{ project: string; budget: number; spent: number }[]> {
    return storage.getTotalBudgetVsSpent();
  },

  async getMonthlySpendingTrends(): Promise<{ month: string; equipment: number; labor: number; transport: number }[]> {
    return storage.getMonthlySpendingTrends();
  },

  async getSpendingByCategory(): Promise<{ category: string; amount: number }[]> {
    return storage.getSpendingByCategory();
  },

  async getExpenseApprovalRates(): Promise<{ status: string; count: number }[]> {
    return storage.getExpenseApprovalRates();
  },

  async getSpendingByEmployee(): Promise<{ employee: string; amount: number }[]> {
    return storage.getSpendingByEmployee();
  },
};