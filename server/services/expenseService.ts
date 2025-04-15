// server/services/expenseService.ts

import { storage } from "../storage";
import { Expense, ExpenseDetails, InsertExpense, ExpenseStatusType } from "@shared/schema";

export const expenseService = {
  async getExpense(id: number): Promise<Expense | undefined> {
    return storage.getExpense(id);
  },

  async getDetailedExpense(id: number): Promise<ExpenseDetails | undefined> {
    return storage.getDetailedExpense(id);
  },

  async getExpenses(): Promise<Expense[]> {
    return storage.getExpenses();
  },

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return storage.getExpensesByProject(projectId);
  },

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    return storage.getExpensesByUser(userId);
  },

  async getExpensesByStatus(status: ExpenseStatusType): Promise<Expense[]> {
    return storage.getExpensesByStatus(status);
  },

  async createExpense(expense: InsertExpense): Promise<Expense> {
    // Add any business logic or validation here before creating the expense
    return storage.createExpense(expense);
  },

  async updateExpenseStatus(id: number, status: string, reviewedById?: number, feedback?: string): Promise<Expense> {
    return storage.updateExpenseStatus(id, status, reviewedById, feedback);
  },
};