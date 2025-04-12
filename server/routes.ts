import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { 
  userLoginSchema, 
  userRegisterSchema, 
  insertClientSchema, 
  projectFormSchema, 
  insertExpenseSchema,
  insertActivityLogSchema,
  UserRole,
  ExpenseStatus
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup passport authentication
  setupAuth(app);
  
  // Old auth routes are now deprecated, but redirected to new endpoints
  app.post('/api/auth/login', (req, res) => {
    // Redirect old login endpoint to the new one
    res.redirect(307, '/api/login');
  });

  app.post('/api/auth/register', (req, res) => {
    // Redirect old register endpoint to the new one
    res.redirect(307, '/api/register');
  });

  app.get('/api/auth/me', (req, res) => {
    // Redirect old me endpoint to the new one
    res.redirect(307, '/api/user');
  });
  
  app.post('/api/auth/logout', (req, res) => {
    // Redirect old logout endpoint to the new one
    res.redirect(307, '/api/logout');
  });

  // Client routes
  app.get('/api/clients', requireAuth, async (req, res) => {
    const { id: userId, role } = req.user;
    
    let clients;
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      clients = await storage.getClients();
    } else if (role === UserRole.SALESPERSON) {
      clients = await storage.getClientsBySalesperson(userId);
    } else {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    res.json(clients);
  });

  app.get('/api/clients/:id', requireAuth, async (req, res) => {
    const client = await storage.getClient(parseInt(req.params.id));
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  });

  app.post('/api/clients', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), 
    async (req, res) => {
      try {
        const { id: userId } = req.user;
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
  app.get('/api/projects', requireAuth, async (req, res) => {
    const { id: userId, role } = req.user;
    const projects = await storage.getProjectsByUser(userId, role);
    res.json(projects);
  });

  app.get('/api/projects/:id', requireAuth, async (req, res) => {
    const project = await storage.getProject(parseInt(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.post('/api/projects', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), 
    async (req, res) => {
      try {
        const { userId } = (req as any).user;
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
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      try {
        const { userId } = (req as any).user;
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
  app.get('/api/expenses', requireAuth, async (req, res) => {
    const { userId, role } = (req as any).user;
    
    let expenses;
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      if (req.query.status) {
        expenses = await storage.getExpensesByStatus(req.query.status as string);
      } else {
        expenses = await storage.getExpenses();
      }
    } else {
      expenses = await storage.getExpensesByUser(userId);
    }
    
    res.json(expenses);
  });

  app.get('/api/projects/:id/expenses', requireAuth, async (req, res) => {
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
    requireAuth, 
    async (req, res) => {
      try {
        const { userId } = (req as any).user;
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
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      try {
        const { userId } = (req as any).user;
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
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const logs = await storage.getActivityLogs();
      res.json(logs);
    }
  );

  app.get('/api/projects/:id/activity-logs', requireAuth, async (req, res) => {
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
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getTotalBudgetVsSpent();
      res.json(data);
    }
  );

  app.get('/api/analytics/monthly-spending', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getMonthlySpendingTrends();
      res.json(data);
    }
  );

  app.get('/api/analytics/spending-by-category', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getSpendingByCategory();
      res.json(data);
    }
  );

  app.get('/api/analytics/expense-approval-rates', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getExpenseApprovalRates();
      res.json(data);
    }
  );

  app.get('/api/analytics/spending-by-employee', 
    requireAuth, 
    requireRole([UserRole.ADMIN, UserRole.MANAGER]), 
    async (req, res) => {
      const data = await storage.getSpendingByEmployee();
      res.json(data);
    }
  );

  return httpServer;
}
