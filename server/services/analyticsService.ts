// server/services/analyticsService.ts

import { EmployeeSpending, ExpenseApprovalRate, MonthlySpending, ProjectBudgetComparison, SpendingCategory } from "@shared/schema";
import { storage } from "../storage";

export const analyticsService = {
  async getTotalBudgetVsSpent(dateRange?: string): Promise<ProjectBudgetComparison[]> {
    return storage.getTotalBudgetVsSpent(dateRange);
  },

  async getMonthlySpendingTrends(): Promise<MonthlySpending[]> {
    return storage.getMonthlySpendingTrends();
  },

  async getSpendingByCategory(): Promise<SpendingCategory[]> {
    return storage.getSpendingByCategory();
  },

  async getExpenseApprovalRates(): Promise<ExpenseApprovalRate[]> {
    return storage.getExpenseApprovalRates();
  },

  async getSpendingByEmployee(): Promise<EmployeeSpending[]> {
    return storage.getSpendingByEmployee();
  },
};