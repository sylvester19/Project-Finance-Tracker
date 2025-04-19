// server/controllers/expenseController.ts

import { Request, Response } from "express";
import { expenseService } from "../services/expenseService";
import { ExpenseStatusType } from "@shared/schema";

export const expenseController = {
  async getExpense(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const expense = await expenseService.getExpense(id);

      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expense" });
    }
  },

  async getExpenses(req: Request, res: Response) {
    try {
      const expenses = await expenseService.getExpenses();
      res.json(expenses);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expenses" });
    }
  },

  async getExpensesByProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const expenses = await expenseService.getExpensesByProject(projectId);
      res.json(expenses);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expenses by project" });
    }
  },

  async getExpensesByUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const expenses = await expenseService.getExpensesByUser(userId);
      res.json(expenses);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expenses by user" });
    }
  },

  async getExpensesByStatus(req: Request, res: Response) {
    try {
      const status = req.params.status as ExpenseStatusType;
      const dateRange = req.query.dateRange as string | undefined;
      const expenses = await expenseService.getExpensesByStatus(status, dateRange);
      res.json(expenses);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get expenses by status" });
    }
  },

  async createExpense(req: Request, res: Response) {
    try {
      const newExpense = await expenseService.createExpense(req.body);
      res.status(201).json(newExpense);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  async updateExpenseStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, reviewedById, feedback } = req.body;
      const updatedExpense = await expenseService.updateExpenseStatus(id, status, reviewedById, feedback);
      res.json(updatedExpense);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },
};