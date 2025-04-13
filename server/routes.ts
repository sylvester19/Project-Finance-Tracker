import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  projectFormSchema, 
  insertExpenseSchema,
  UserRole,
  ExpenseStatus,
  ExpenseStatusType
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import {authenticateViaSession, authorizeRole} from "../middleware/authMiddleware.ts"

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // set up login | logout | register endpoints directly with session in the db same session on client 
  setupAuth(app);
  
  // Client routes
  app.get('/api/clients', authenticateViaSession, async (req, res) => {
    const { userId, role } = req.session;
    
    if (!userId) {
      return res.status(500).json({ message: "Session invalid @/api/clients: missing userId" });
    }    
  
    let clients;
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      clients = await storage.getClients();
    } else if (role === UserRole.SALESPERSON) {
      clients = await storage.getClientsBySalesperson(userId);
    } else {
      return res.status(403).json({ message: "Insufficient permissions @/api/clients" });
    }
    
    res.json(clients);
  });

  app.get('/api/clients/:id', authenticateViaSession, async (req, res) => {
    const client = await storage.getClient(parseInt(req.params.id));
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  });

  app.post('/api/clients', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), 
    async (req, res) => {
      try {
        const { userId } = req.session;

        if (!userId) {
          return res.status(500).json({ message: "Session invalid @/api/clients: missing userId" });
        }    
  
        const clientData = insertClientSchema.parse({
          ...req.body,
          createdById: userId
        });
        
        const client = await storage.createClient(clientData);
        
        // Log activity
        await storage.createActivityLog({
          userId,
          action: "created_client",
          details: `Created client ${client.name}`,
        });
        
        res.status(201).json(client);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: fromZodError(error).message 
          });
        }
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Project routes
  app.get('/api/projects', authenticateViaSession, async (req, res) => {
    const { userId, role } = req.session;
    if (!userId) {
      return res.status(500).json({ message: "Session invalid @/api/projects: missing userId" });
    }    

    if (!role) {
      return res.status(500).json({ message: "Session invalid @/api/projects: missing role" });
    }
  
    const projects = await storage.getProjectsByUser(userId, role);
    res.json(projects);
  });

  app.get('/api/projects/:id', authenticateViaSession, async (req, res) => {
    const project = await storage.getProject(parseInt(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.post('/api/projects', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), 
    async (req, res) => {
      try {
        const { userId } = req.session;

        if (!userId) {
          return res.status(500).json({ message: "Session invalid @/api/projects: missing userId" });
        }

        const projectData = projectFormSchema.parse({
          ...req.body,
          createdById: userId
        });
        
        // Verify client exists
        const client = await storage.getClient(projectData.clientId);
        if (!client) {
          return res.status(400).json({ message: "Client not found" });
        }
        
        const project = await storage.createProject(projectData);
        
        // Log activity
        await storage.createActivityLog({
          userId,
          projectId: project.id,
          action: "created_project",
          details: `Created project ${project.name} with budget $${project.budget}`,
        });
        
        res.status(201).json(project);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: fromZodError(error).message 
          });
        }
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.patch('/api/projects/:id/status', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      try {
        const { userId } = req.session;
        if (!userId) {
          return res.status(500).json({ message: "Session invalid @/api/projects/:id/status: missing userId" });
        }
        const projectId = parseInt(req.params.id);
        const { status } = req.body;
        
        if (!status) {
          return res.status(400).json({ message: "Status is required" });
        }
        
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const updatedProject = await storage.updateProjectStatus(projectId, status);
        
        // Log activity
        await storage.createActivityLog({
          userId,
          projectId,
          action: "updated_project_status",
          details: `Updated project status to ${status}`,
        });
        
        res.json(updatedProject);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Expense routes
  app.get('/api/expenses', authenticateViaSession, async (req, res) => {
    const { userId, role } = req.session;
    
    if (!userId) {
      return res.status(500).json({ message: "Session invalid @/api/expenses: missing userId" });
    }

    const rawStatus = req.query.status;
    let status: ExpenseStatusType | undefined = undefined;

    if (typeof rawStatus === "string") {
      const possibleStatus = rawStatus as string;
      if (Object.values(ExpenseStatus).includes(possibleStatus as ExpenseStatusType)) {
        status = possibleStatus as ExpenseStatusType;
      } else {
        return res.status(400).json({ message: `Invalid status value: ${possibleStatus}` });
      }
    }
    
    let expenses;
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      if (status) {
        expenses = await storage.getExpensesByStatus(status);
      } else {
        expenses = await storage.getExpenses();
      }
    } else {
      expenses = await storage.getExpensesByUser(userId);
    }
    
    res.json(expenses);
  });

  app.get('/api/projects/:id/expenses', authenticateViaSession, async (req, res) => {
    const projectId = parseInt(req.params.id);
    
    // Verify project exists
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const expenses = await storage.getExpensesByProject(projectId);
    res.json(expenses);
  });

  app.post('/api/expenses', 
    authenticateViaSession, 
    async (req, res) => {
      try {
        const { userId } = req.session;
        if (!userId) {
          return res.status(500).json({ message: "Session invalid @/api/expenses: missing userId" });
        }
        const expenseData = insertExpenseSchema.parse({
          ...req.body,
          submittedById: userId,
          status: ExpenseStatus.PENDING
        });
        
        // Verify project exists
        const project = await storage.getProject(expenseData.projectId);
        if (!project) {
          return res.status(400).json({ message: "Project not found" });
        }
        
        const expense = await storage.createExpense(expenseData);
        
        // Log activity
        await storage.createActivityLog({
          userId,
          projectId: expense.projectId,
          expenseId: expense.id,
          action: "submitted_expense",
          details: `Submitted expense of $${expense.amount} for ${expense.description}`,
        });
        
        res.status(201).json(expense);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: fromZodError(error).message 
          });
        }
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.patch('/api/expenses/:id/status', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      try {
        const { userId } = req.session;

        if (!userId) {
          return res.status(500).json({ message: "Session invalid @/api/expenses/:id/status: missing userId" });
        }
        const expenseId = parseInt(req.params.id);
        const { status, feedback } = req.body;
        
        if (!status) {
          return res.status(400).json({ message: "Status is required" });
        }
        
        // Verify expense exists
        const expense = await storage.getExpense(expenseId);
        if (!expense) {
          return res.status(404).json({ message: "Expense not found" });
        }
        
        const updatedExpense = await storage.updateExpenseStatus(expenseId, status, userId, feedback);
        
        // Log activity
        const action = status === ExpenseStatus.APPROVED ? "approved_expense" : "rejected_expense";
        await storage.createActivityLog({
          userId,
          projectId: expense.projectId,
          expenseId: expense.id,
          action,
          details: `${status} expense of $${expense.amount} for ${expense.description}${feedback ? ` with feedback: ${feedback}` : ''}`,
        });
        
        res.json(updatedExpense);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Activity logs
  app.get('/api/activity-logs', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const logs = await storage.getActivityLogs();
      res.json(logs);
    }
  );

  app.get('/api/projects/:id/activity-logs', authenticateViaSession, async (req, res) => {
    const projectId = parseInt(req.params.id);
    
    // Verify project exists
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const logs = await storage.getActivityLogsByProject(projectId);
    res.json(logs);
  });

  // Analytics routes
  app.get('/api/analytics/budget-vs-spent', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getTotalBudgetVsSpent();
      res.json(data);
    }
  );

  app.get('/api/analytics/monthly-spending', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getMonthlySpendingTrends();
      res.json(data);
    }
  );

  app.get('/api/analytics/spending-by-category', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getSpendingByCategory();
      res.json(data);
    }
  );

  app.get('/api/analytics/expense-approval-rates', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getExpenseApprovalRates();
      res.json(data);
    }
  );

  app.get('/api/analytics/spending-by-employee', 
    authenticateViaSession, 
    authorizeRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getSpendingByEmployee();
      res.json(data);
    }
  );

  return httpServer;
}
