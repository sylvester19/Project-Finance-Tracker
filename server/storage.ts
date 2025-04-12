import {
  User, InsertUser, users,
  Client, InsertClient, clients,
  Project, InsertProject, projects,
  Expense, InsertExpense, expenses,
  ActivityLog, InsertActivityLog, activityLogs,
  ExpenseStatus, ProjectStatus, UserRole, ExpenseCategory
} from "@shared/schema";
import { eq, sql } from 'drizzle-orm';
import type { ProjectStatusType, ExpenseStatusType } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Interface for all storage operations
export interface IStorage {
  // Session store for Express session
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientsBySalesperson(salesPersonId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number, userRole: string): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectStatus(id: number, status: string): Promise<Project>;
  
  // Expense operations
  getExpense(id: number): Promise<Expense | undefined>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByProject(projectId: number): Promise<Expense[]>;
  getExpensesByUser(userId: number): Promise<Expense[]>;
  getExpensesByStatus(status: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, status: string, reviewedById?: number, feedback?: string): Promise<Expense>;
  
  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(): Promise<ActivityLog[]>;
  getActivityLogsByProject(projectId: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Analytics operations
  getTotalBudgetVsSpent(): Promise<{ project: string; budget: number; spent: number }[]>;
  getMonthlySpendingTrends(): Promise<{ month: string; equipment: number; labor: number; transport: number }[]>;
  getSpendingByCategory(): Promise<{ category: string; amount: number }[]>;
  getExpenseApprovalRates(): Promise<{ status: string; count: number }[]>;
  getSpendingByEmployee(): Promise<{ employee: string; amount: number }[]>;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private expenses: Map<number, Expense>;
  private activityLogs: Map<number, ActivityLog>;
  private currentUserId: number;
  private currentClientId: number;
  private currentProjectId: number;
  private currentExpenseId: number;
  private currentActivityLogId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.expenses = new Map();
    this.activityLogs = new Map();
    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentProjectId = 1;
    this.currentExpenseId = 1;
    this.currentActivityLogId = 1;
    
    // Create memory store for session
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed the database with initial data
    this.seedData();
  }
  
  private async seedData() {
    // Add users with different roles
    const admin = await this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      name: "Admin User",
      role: "admin"
    });
    
    const manager = await this.createUser({
      username: "manager",
      password: "password",
      name: "Manager User",
      role: "manager"
    });
    
    const salesperson = await this.createUser({
      username: "sales",
      password: "password",
      name: "Sales Person",
      role: "salesperson"
    });
    
    const employee = await this.createUser({
      username: "employee",
      password: "password",
      name: "Field Employee",
      role: "employee"
    });
    
    // Add clients
    const client1 = await this.createClient({
      name: "ABC Corporation",
      contactPerson: "John Smith",
      contactEmail: "john@abccorp.com",
      contactPhone: "555-123-4567",
      createdById: salesperson.id
    });
    
    const client2 = await this.createClient({
      name: "Sunshine Homes",
      contactPerson: "Emma Johnson",
      contactEmail: "emma@sunshinehomes.com",
      contactPhone: "555-987-6543",
      createdById: salesperson.id
    });
    
    const client3 = await this.createClient({
      name: "Green Energy Co-op",
      contactPerson: "Michael Chen",
      contactEmail: "michael@greenenergy.org",
      contactPhone: "555-456-7890",
      createdById: manager.id
    });
    
    // Add projects
    const project1 = await this.createProject({
      name: "ABC HQ Solar Installation",
      clientId: client1.id,
      status: "in_progress",
      startDate: new Date("2025-01-15").toISOString(),
      budget: 250000,
      createdById: salesperson.id
    });
    
    const project2 = await this.createProject({
      name: "Sunshine Homes Residential",
      clientId: client2.id,
      status: "planning",
      startDate: new Date("2025-03-01").toISOString(),
      budget: 120000,
      createdById: salesperson.id
    });
    
    const project3 = await this.createProject({
      name: "Green Co-op Phase 1",
      clientId: client3.id,
      status: "completed",
      startDate: new Date("2024-11-01").toISOString(),
      budget: 350000,
      createdById: manager.id
    });
    
    // Add expenses
    await this.createExpense({
      projectId: project1.id,
      amount: 45000,
      description: "Initial equipment purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project1.id,
      amount: 32000,
      description: "Mounting hardware and installation materials",
      category: "equipment",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project1.id,
      amount: 18500,
      description: "Installation labor - Week 1",
      category: "labor",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project1.id,
      amount: 5600,
      description: "Transportation and equipment delivery",
      category: "transport",
      status: "pending",
      submittedById: employee.id
    });
    
    await this.createExpense({
      projectId: project2.id,
      amount: 28000,
      description: "Initial equipment purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project3.id,
      amount: 85000,
      description: "Solar panels bulk purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project3.id,
      amount: 42000,
      description: "Installation labor - Phase 1",
      category: "labor",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project3.id,
      amount: 12500,
      description: "Transportation and site logistics",
      category: "transport",
      status: "approved",
      submittedById: employee.id,
      reviewedById: manager.id
    });
    
    await this.createExpense({
      projectId: project3.id,
      amount: 7800,
      description: "Electrical wiring and connections",
      category: "equipment",
      status: "rejected",
      submittedById: employee.id,
      reviewedById: manager.id,
      feedback: "Please itemize this expense further and resubmit"
    });
    
    // Add some activity logs
    await this.createActivityLog({
      userId: salesperson.id,
      projectId: project1.id,
      action: "created_project",
      details: "Created project ABC HQ Solar Installation with budget $250000"
    });
    
    await this.createActivityLog({
      userId: employee.id,
      projectId: project1.id,
      expenseId: 1,
      action: "submitted_expense",
      details: "Submitted expense of $45000 for Initial equipment purchase"
    });
    
    await this.createActivityLog({
      userId: manager.id,
      projectId: project1.id,
      expenseId: 1,
      action: "approved_expense",
      details: "Approved expense of $45000 for Initial equipment purchase"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsBySalesperson(salesPersonId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.createdById === salesPersonId,
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByUser(userId: number, userRole: string): Promise<Project[]> {
    if (userRole === "admin" || userRole === "manager") {
      return Array.from(this.projects.values());
    }
    return Array.from(this.projects.values()).filter(
      (project) => project.createdById === userId,
    );
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId,
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    const updatedProject = { ...project, status };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Expense operations
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.projectId === projectId,
    );
  }

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.submittedById === userId,
    );
  }

  async getExpensesByStatus(status: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.status === status,
    );
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const createdAt = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpenseStatus(id: number, status: string, reviewedById?: number, feedback?: string): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    const updatedExpense = { 
      ...expense, 
      status, 
      ...(reviewedById && { reviewedById }),
      ...(feedback && { feedback })
    };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values());
  }

  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).filter(
      (log) => log.projectId === projectId,
    );
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const timestamp = new Date();
    const log: ActivityLog = { ...insertLog, id, timestamp };
    this.activityLogs.set(id, log);
    return log;
  }

  // Analytics operations
  async getTotalBudgetVsSpent(): Promise<{ project: string; budget: number; spent: number }[]> {
    const result: { project: string; budget: number; spent: number }[] = [];
    
    for (const project of this.projects.values()) {
      const expenses = await this.getExpensesByProject(project.id);
      const spent = expenses
        .filter(e => e.status === ExpenseStatus.APPROVED)
        .reduce((total, expense) => total + expense.amount, 0);
      
      result.push({
        project: project.name,
        budget: project.budget,
        spent: spent
      });
    }
    
    return result;
  }

  async getMonthlySpendingTrends(): Promise<{ month: string; equipment: number; labor: number; transport: number }[]> {
    // Mock data for demonstration - in a real app this would aggregate actual expenses
    return [
      { month: 'Jan', equipment: 45000, labor: 30000, transport: 12000 },
      { month: 'Feb', equipment: 52000, labor: 35000, transport: 15000 },
      { month: 'Mar', equipment: 48000, labor: 28000, transport: 10000 },
      { month: 'Apr', equipment: 58000, labor: 32000, transport: 14000 },
      { month: 'May', equipment: 63000, labor: 38000, transport: 16000 },
      { month: 'Jun', equipment: 70000, labor: 42000, transport: 18000 }
    ];
  }

  async getSpendingByCategory(): Promise<{ category: string; amount: number }[]> {
    const approvedExpenses = Array.from(this.expenses.values())
      .filter(expense => expense.status === ExpenseStatus.APPROVED);
    
    const categoryMap = new Map<string, number>();
    
    for (const expense of approvedExpenses) {
      const currentAmount = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentAmount + expense.amount);
    }
    
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount
    }));
  }

  async getExpenseApprovalRates(): Promise<{ status: string; count: number }[]> {
    const pendingCount = Array.from(this.expenses.values())
      .filter(e => e.status === ExpenseStatus.PENDING).length;
    
    const approvedCount = Array.from(this.expenses.values())
      .filter(e => e.status === ExpenseStatus.APPROVED).length;
    
    const rejectedCount = Array.from(this.expenses.values())
      .filter(e => e.status === ExpenseStatus.REJECTED).length;
    
    return [
      { status: 'Pending', count: pendingCount },
      { status: 'Approved', count: approvedCount },
      { status: 'Rejected', count: rejectedCount }
    ];
  }

  async getSpendingByEmployee(): Promise<{ employee: string; amount: number }[]> {
    const result = new Map<number, number>();
    const approvedExpenses = Array.from(this.expenses.values())
      .filter(expense => expense.status === ExpenseStatus.APPROVED);
    
    // Calculate total approved expenses per employee
    for (const expense of approvedExpenses) {
      const currentTotal = result.get(expense.submittedById) || 0;
      result.set(expense.submittedById, currentTotal + expense.amount);
    }
    
    // Get employee names
    const finalResult: { employee: string; amount: number }[] = [];
    for (const [userId, amount] of result.entries()) {
      const user = await this.getUser(userId);
      if (user) {
        finalResult.push({
          employee: user.name,
          amount
        });
      }
    }
    
    return finalResult;
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Create PostgreSQL session store
    // Using dynamic import for connect-pg-simple
    import('connect-pg-simple').then(pgSessionModule => {
      const PgSession = pgSessionModule.default(session);
      this.sessionStore = new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true
      });
    });
    
    // Create a temporary memory store until the PG store is initialized
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { db } = await import('./db');
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { db } = await import('./db');
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const { db } = await import('./db');
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClients(): Promise<Client[]> {
    const { db } = await import('./db');
    return db.select().from(clients);
  }

  async getClientsBySalesperson(salesPersonId: number): Promise<Client[]> {
    const { db } = await import('./db');
    return db.select().from(clients).where(eq(clients.createdById, salesPersonId));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const { db } = await import('./db');
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const { db } = await import('./db');
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(): Promise<Project[]> {
    const { db } = await import('./db');
    return db.select().from(projects);
  }

  async getProjectsByUser(userId: number, userRole: string): Promise<Project[]> {
    const { db } = await import('./db');
    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return db.select().from(projects);
    }
    return db.select().from(projects).where(eq(projects.createdById, userId));
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    const { db } = await import('./db');
    return db.select().from(projects).where(eq(projects.clientId, clientId));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const { db } = await import('./db');
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const { db } = await import('./db');
    const [updatedProject] = await db
      .update(projects)
      .set({ status: status as ProjectStatusType })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Expense operations
  async getExpense(id: number): Promise<Expense | undefined> {
    const { db } = await import('./db');
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    const { db } = await import('./db');
    return db.select().from(expenses);
  }

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    const { db } = await import('./db');
    return db.select().from(expenses).where(eq(expenses.projectId, projectId));
  }

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    const { db } = await import('./db');
    return db.select().from(expenses).where(eq(expenses.submittedById, userId));
  }

  async getExpensesByStatus(status: string): Promise<Expense[]> {
    const { db } = await import('./db');
    return db.select().from(expenses).where(eq(expenses.status, status as ExpenseStatusType));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const { db } = await import('./db');
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpenseStatus(id: number, status: string, reviewedById?: number, feedback?: string): Promise<Expense> {
    const { db } = await import('./db');
    const [updatedExpense] = await db
      .update(expenses)
      .set({ 
        status: status as ExpenseStatusType, 
        reviewedById: reviewedById || null, 
        feedback: feedback || null 
      })
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const { db } = await import('./db');
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const { db } = await import('./db');
    return db.select().from(activityLogs);
  }

  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    const { db } = await import('./db');
    return db.select().from(activityLogs).where(eq(activityLogs.projectId, projectId));
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    const { db } = await import('./db');
    return db.select().from(activityLogs).where(eq(activityLogs.userId, userId));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const { db } = await import('./db');
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Analytics operations
  async getTotalBudgetVsSpent(): Promise<{ project: string; budget: number; spent: number }[]> {
    const { db } = await import('./db');
    const allProjects = await db.select().from(projects);
    const result: { project: string; budget: number; spent: number }[] = [];
    
    for (const project of allProjects) {
      const projectExpenses = await db
        .select()
        .from(expenses)
        .where(sql`${expenses.projectId} = ${project.id} AND ${expenses.status} = ${ExpenseStatus.APPROVED}`);
      
      const spent = projectExpenses.reduce((total, expense) => total + expense.amount, 0);
      
      result.push({
        project: project.name,
        budget: project.budget,
        spent
      });
    }
    
    return result;
  }

  async getMonthlySpendingTrends(): Promise<{ month: string; equipment: number; labor: number; transport: number }[]> {
    // This would be implemented with aggregation queries against the database
    // For now, return mock data as in the in-memory version
    return [
      { month: 'Jan', equipment: 45000, labor: 30000, transport: 12000 },
      { month: 'Feb', equipment: 52000, labor: 35000, transport: 15000 },
      { month: 'Mar', equipment: 48000, labor: 28000, transport: 10000 },
      { month: 'Apr', equipment: 58000, labor: 32000, transport: 14000 },
      { month: 'May', equipment: 63000, labor: 38000, transport: 16000 },
      { month: 'Jun', equipment: 70000, labor: 42000, transport: 18000 }
    ];
  }

  async getSpendingByCategory(): Promise<{ category: string; amount: number }[]> {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    
    const result = await db
      .select({
        category: expenses.category,
        amount: sql<number>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(eq(expenses.status, ExpenseStatus.APPROVED))
      .groupBy(expenses.category);
    
    return result;
  }

  async getExpenseApprovalRates(): Promise<{ status: string; count: number }[]> {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    
    const stats = await db
      .select({
        status: expenses.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .groupBy(expenses.status);
    
    return stats.map(stat => ({
      status: stat.status === ExpenseStatus.PENDING ? 'Pending' :
              stat.status === ExpenseStatus.APPROVED ? 'Approved' : 'Rejected',
      count: stat.count
    }));
  }

  async getSpendingByEmployee(): Promise<{ employee: string; amount: number }[]> {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    
    const result = await db
      .select({
        userId: expenses.submittedById,
        amount: sql<number>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(eq(expenses.status, ExpenseStatus.APPROVED))
      .groupBy(expenses.submittedById);
    
    const finalResult: { employee: string; amount: number }[] = [];
    
    for (const row of result) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.userId));
      
      if (user) {
        finalResult.push({
          employee: user.name,
          amount: row.amount
        });
      }
    }
    
    return finalResult;
  }
}

// For real database connections, use:
export const storage = new DatabaseStorage();

// For in-memory storage, use:
// export const storage = new MemStorage();
