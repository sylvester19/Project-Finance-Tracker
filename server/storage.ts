import {
  SessionToken, sessionToken, User, InsertUser, users,
  Client, InsertClient, clients,
  Project, InsertProject, projects,
  Expense, ExpenseDetails, InsertExpense, expenses,
  ActivityLog, InsertActivityLog, activityLogs,
  ExpenseStatus, UserRole, UserRoleType, ExpenseCategoryType,
  activityLogTargets,
  notificationReads,
  ActivityAction,
} from "@shared/schema";
import { eq, sql } from 'drizzle-orm';
import type { ProjectStatusType, ExpenseStatusType, InternalUser, SpendingCategory, MonthlySpending, ProjectBudgetComparison, InsertActivityLogTarget, ActivityLogDetails, ExpenseApprovalRate, EmployeeSpending } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { comparePasswords } from "../utils/session"

// Interface for all storage operations
export interface IStorage {
  // Session store for Express session
  sessionStore: session.Store;

  // Transformation function
  toSafeUser(user: InternalUser): User;

  // Session Token Operation
  saveRefreshToken(userId: number, refreshToken: string, expiresAt: Date): Promise<void>;
  getRefreshToken(refreshToken: string): Promise<SessionToken | undefined>; 
  deleteRefreshToken(refreshToken: string): Promise<void>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | undefined>;
  
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
  getDetailedExpense(id: number): Promise<ExpenseDetails | undefined>;
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
  assignActivityLogTargets(targets: InsertActivityLogTarget[]): Promise<void>;
  
  // Notification Read operations
  markNotificationRead(userId: number, activityLogId: number): Promise<void>;
  getUnreadNotifications(userId: number): Promise<ActivityLog[]>;

  // Analytics operations
  getTotalBudgetVsSpent(): Promise<ProjectBudgetComparison[]>;
  getMonthlySpendingTrends(): Promise<MonthlySpending[]>;
  getSpendingByCategory(): Promise<SpendingCategory[]>;
  getExpenseApprovalRates(): Promise<ExpenseApprovalRate[]>;
  getSpendingByEmployee(): Promise<EmployeeSpending[]>;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private sessionTokens: Map<string, SessionToken>;
  private users: Map<number, InternalUser>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private expenses: Map<number, Expense>;
  private activityLogs: Map<number, ActivityLog>;
  private readNotifications: { userId: number; activityLogId: number }[] = [];
  private currentUserId: number;
  private currentClientId: number;
  private currentProjectId: number;
  private currentExpenseId: number;
  private currentActivityLogId: number;
  public sessionStore: session.Store;
  private generateId(): number {
    return Math.floor(Math.random() * 1000000);
  }
  public toSafeUser(user: InternalUser): User {
    const { password, ...User } = user;
    return User;
  }

  constructor() {
    this.sessionTokens = new Map();
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
    
    const employee1 = await this.createUser({
      username: "employee1",
      password: "password",
      name: "Field Employee",
      role: "employee"
    });

    const employee2 = await this.createUser({
      username: "employee2",
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
      startDate: new Date("2025-01-15"),
      budget: 250000,
      createdById: salesperson.id
    });
    
    const project2 = await this.createProject({
      name: "Sunshine Homes Residential",
      clientId: client2.id,
      status: "planning",
      startDate: new Date("2025-03-01"),
      budget: 120000,
      createdById: salesperson.id
    });
    
    const project3 = await this.createProject({
      name: "Green Co-op Phase 1",
      clientId: client3.id,
      status: "completed",
      startDate: new Date("2024-11-01"),
      budget: 350000,
      createdById: manager.id
    });
    
    // Add expenses
    const expense1 = await this.createExpense({
      projectId: project1.id,
      amount: 45000,
      description: "Initial equipment purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee1.id,
      reviewedById: manager.id
    });
    
    const expense2 = await this.createExpense({
      projectId: project1.id,
      amount: 32000,
      description: "Mounting hardware and installation materials",
      category: "equipment",
      status: "approved",
      submittedById: employee2.id,
      reviewedById: manager.id
    });
    
    const expense3 = await this.createExpense({
      projectId: project1.id,
      amount: 18500,
      description: "Installation labor - Week 1",
      category: "labor",
      status: "approved",
      submittedById: employee1.id,
      reviewedById: manager.id
    });
    
    const expense4 = await this.createExpense({
      projectId: project1.id,
      amount: 5600,
      description: "Transportation and equipment delivery",
      category: "transport",
      status: "pending",
      submittedById: employee2.id
    });
    
    const expense5 = await this.createExpense({
      projectId: project2.id,
      amount: 28000,
      description: "Initial equipment purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee2.id,
      reviewedById: manager.id
    });
    
    const expense6 = await this.createExpense({
      projectId: project3.id,
      amount: 85000,
      description: "Solar panels bulk purchase",
      category: "equipment",
      status: "approved",
      submittedById: employee1.id,
      reviewedById: manager.id
    });
    
    const expense7 = await this.createExpense({
      projectId: project3.id,
      amount: 42000,
      description: "Installation labor - Phase 1",
      category: "labor",
      status: "approved",
      submittedById: employee1.id,
      reviewedById: manager.id
    });
    
    const expense8 = await this.createExpense({
      projectId: project3.id,
      amount: 12500,
      description: "Transportation and site logistics",
      category: "transport",
      status: "approved",
      submittedById: employee2.id,
      reviewedById: manager.id
    });
    
    const expense9 = await this.createExpense({
      projectId: project3.id,
      amount: 7800,
      description: "Electrical wiring and connections",
      category: "equipment",
      status: "rejected",
      submittedById: employee1.id,
      reviewedById: manager.id,
      feedback: "Please itemize this expense further and resubmit"
    });
    
    // Add some activity logs
    await this.createActivityLog({
      userId: employee2.id,
      projectId: project1.id,
      action: ActivityAction.EXPENSE_SUBMITTED,
      details: expense1
    });
    
    
    await this.createActivityLog({
      userId: employee1.id,
      projectId: project3.id,
      action: ActivityAction.PROJECT_UPDATED,
      details: project3
    });
    
    
    await this.createActivityLog({
      userId: employee2.id,
      projectId: project1.id,
      action: ActivityAction.EXPENSE_SUBMITTED,
      details: expense6
    });
    
    await this.createActivityLog({
      userId: employee1.id,
      projectId: project1.id,
      action: ActivityAction.USER_ASSIGNED,
      details: employee1
    });
    
    await this.createActivityLog({
      userId: employee2.id,
      projectId: project1.id,
      action: ActivityAction.EXPENSE_SUBMITTED,
      details: expense3
    });
  }

  // Session Token Operation
  async saveRefreshToken(userId: number, refreshToken: string, expiresAt: Date): Promise<void> {
    const newSessionToken: SessionToken = {
      id: this.generateId(), // Use UUID for unique IDs
      userId: userId,
      refreshToken: refreshToken,
      createdAt: new Date(), // Or use a more appropriate creation time
      expiresAt: expiresAt,
    };
    this.sessionTokens.set(refreshToken, newSessionToken); // Key by refreshToken
  }

  async getRefreshToken(refreshToken: string): Promise<SessionToken | undefined> {
    return this.sessionTokens.get(refreshToken); // Key by refreshToken
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    this.sessionTokens.delete(refreshToken); // Key by refreshToken
  }


  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    return user ? this.toSafeUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
    return user ? this.toSafeUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: InternalUser = { ...insertUser, id, role: insertUser.role as UserRoleType};
    this.users.set(id, user);
    return this.toSafeUser(user);
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => u.username === username);

    if (!user) {
      return undefined; // User not found
    }

    try {
      const passwordMatch = await comparePasswords(password, user.password);
      if (passwordMatch) {
        return user;
      }
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return undefined; // Or throw, depending on your error handling
    }

    return undefined; // Invalid password
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
    const client: Client = { ...insertClient, id, contactEmail: insertClient.contactEmail ?? null, contactPhone: insertClient.contactPhone ?? null };
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
    const project: Project = { ...insertProject, id, status: insertProject.status as ProjectStatusType };
    this.projects.set(id, project);
    return project;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    const updatedProject = { ...project, status: status as ProjectStatusType };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Expense operations
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getDetailedExpense(id: number): Promise<ExpenseDetails | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) {
      return undefined;
    }

    const submitter = Array.from(this.users.values()).find(user => user.id === expense.submittedById);
    const reviewer = expense.reviewedById ? Array.from(this.users.values()).find(user => user.id === expense.reviewedById) : undefined;
    const project = Array.from(this.projects.values()).find(project => project.id === expense.projectId);

    const safeSubmitter: User | undefined = submitter ? {
      id: submitter.id,
      name: submitter.name,
      username: submitter.username,
      role: submitter.role,
    } : undefined;

    const safeReviewer: User | undefined = reviewer ? {
      id: reviewer.id,
      name: reviewer.name,
      username: reviewer.username,
      role: reviewer.role,
    } : undefined;

    const expenseDetails: ExpenseDetails = {
      expense: expense,
      submitter: safeSubmitter,
      reviewer: safeReviewer,
      project: project || undefined,
    };

    return expenseDetails;
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

  async getExpensesByStatus(status: ExpenseStatusType): Promise<Expense[]> {
      return Array.from(this.expenses.values()).filter(
        (expense) => expense.status === status,
      );
    }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const createdAt = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt, status: insertExpense.status as ExpenseStatusType, category: insertExpense.category as ExpenseCategoryType, receiptUrl: insertExpense.receiptUrl ?? null, reviewedById: insertExpense.reviewedById ?? null, feedback: insertExpense.feedback ?? null };
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
    this.expenses.set(id, updatedExpense as Expense);
    return updatedExpense as Expense;
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

  async createActivityLog(insertLog: {
    userId: number;
    projectId: number;
    action: ActivityAction;
    details: ActivityLogDetails;
  }): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const timestamp = new Date();
  
    const log: ActivityLog = {
      id,
      userId: insertLog.userId,
      projectId: insertLog.projectId,
      action: insertLog.action,
      details: insertLog.details,
      timestamp
    };
  
    this.activityLogs.set(id, log);
    return log;
  }
  
  async assignActivityLogTargets(targets: InsertActivityLogTarget[]): Promise<void> {
    console.warn("assignActivityLogTargets not fully implemented in MemStorage");
  }


  // Notification Read operations
  async markNotificationRead(userId: number, activityLogId: number): Promise<void> {
    console.warn("markNotificationRead not fully implemented in MemStorage");
  }

  async getUnreadNotifications(userId: number): Promise<ActivityLog[]> {
    const unread: ActivityLog[] = [];
    this.activityLogs.forEach((log) => {
      if (
        // Check if the log is unread by the user
        !this.readNotifications.some(
          (n) => n.userId === userId && n.activityLogId === log.id
        ) &&
        // Check if the log is relevant to the user (either the userId matches or the details include the userId)
        (log.userId === userId || (log.details && log.details.id === userId))
      ) {
        unread.push(log);
      }
    });
    return unread;
  }

  // Analytics operations
  async getTotalBudgetVsSpent(): Promise<ProjectBudgetComparison[]> {
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

  async getMonthlySpendingTrends(): Promise<MonthlySpending[]> {
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

  async getSpendingByCategory(): Promise<SpendingCategory[]> {
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
    })) as SpendingCategory[];
  }

  async getExpenseApprovalRates(): Promise<ExpenseApprovalRate[]> {
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

  async getSpendingByEmployee(): Promise<EmployeeSpending[]> {
    const result = new Map<number, number>();
  
    const approvedExpenses = Array.from(this.expenses.values())
      .filter(expense => expense.status === ExpenseStatus.APPROVED);
  
    // Calculate total approved expenses per employee
    for (const expense of approvedExpenses) {
      const currentTotal = result.get(expense.submittedById) || 0;
      result.set(expense.submittedById, currentTotal + expense.amount);
    }
  
    // Prepare final results with employee details
    const finalResult: EmployeeSpending[] = [];
    for (const [userId, amount] of result.entries()) {
      const user = this.users.get(userId);
      if (user) {
        finalResult.push({
          employeeId: user.id,
          employeeName: user.name,
          amount,
        });
      }
    }
  
    return finalResult;
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  public toSafeUser(user: InternalUser): User {
    const { password, ...User } = user;
    return User;
  }

  constructor() {
    this.sessionStore = null as any;
  }

  async initialize() {
    // Create PostgreSQL session store
    // Using dynamic import for connect-pg-simple
    const pgSessionModule = await import('connect-pg-simple');
    const PgSession = pgSessionModule.default(session);
    this.sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }
  
  // Session Token Operation
  async saveRefreshToken(userId: number, refreshToken: string, expiresAt: Date): Promise<void> {
    const { db } = await import('./db');
    await db.insert(sessionToken).values({  // Use sessionToken table
      userId,
      refreshToken, // Use refreshToken field name
      expiresAt,
    });
  }

  async getRefreshToken(refreshToken: string): Promise<SessionToken | undefined> {
    const { db } = await import('./db');
    const [token] = await db.select().from(sessionToken).where(eq(sessionToken.refreshToken, refreshToken)); // Use sessionToken table and refreshToken field
    return token; // Return the entire sessionToken object or undefined
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    const { db } = await import('./db');
    await db.delete(sessionToken).where(eq(sessionToken.refreshToken, refreshToken)); // Use sessionToken table and refreshToken field
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
    const [user] = await db.insert(users).values({...insertUser, role: insertUser.role as UserRoleType}).returning();
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    const { db } = await import('./db');
    
    await db.delete(users).where(eq(users.id, userId));
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {   
      const { db } = await import('./db');
      const [user] = await db.select().from(users).where(eq(users.username, username));

      if (!user) {
        return undefined; // User not found
      }

      const passwordMatch = await comparePasswords(password, user.password);

      if (passwordMatch) {
        return user;
      }

      return undefined; // Invalid password    
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

  async getProjectsByUser(userId: number, userRole: UserRoleType): Promise<Project[]> {
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
    const [newProject] = await db.insert(projects).values({...project, status: project.status as ProjectStatusType}).returning();
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

  async getDetailedExpense(id: number): Promise<ExpenseDetails | undefined> {
    const { db } = await import('./db');

    try {
      const [expenseWithDetails] = await db.select({
        expense: expenses,
        submitter: {
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
        },
        reviewer: {
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
        }, 
        project: projects, 
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.submittedById, users.id))
      .leftJoin(users, eq(expenses.reviewedById, users.id))
      .leftJoin(projects, eq(expenses.projectId, projects.id))
      .where(eq(expenses.id, Number(id)))
      .limit(1);

      if (!expenseWithDetails) {
        return undefined;
      }

      return expenseWithDetails as ExpenseDetails;
    } catch (error) {
      console.error('Error fetching detailed expense from database:', error);
      return undefined; // Or throw, depending on your error handling
    }
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

  async getExpensesByStatus(status: ExpenseStatusType): Promise<Expense[]> {
      const { db } = await import('./db');
      return db.select().from(expenses).where(eq(expenses.status, status));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const { db } = await import('./db');
    const [newExpense] = await db.insert(expenses).values({...expense, category: expense.category as ExpenseCategoryType, status: expense.status as ExpenseStatusType}).returning();
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

  async assignActivityLogTargets(targets: InsertActivityLogTarget[]): Promise<void> {
    const { db } = await import('./db');
    await db.insert(activityLogTargets).values(targets);
  }

  // Notification Read operations
  async markNotificationRead(userId: number, activityLogId: number): Promise<void> {
    const { db } = await import('./db');
    await db.insert(notificationReads).values({ userId, activityLogId });
  }

  async getUnreadNotifications(userId: number): Promise<ActivityLog[]> {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
  
    const result = await db
      .select()
      .from(activityLogs)
      .leftJoin(
        notificationReads,
        sql`${activityLogs.id} = ${notificationReads.activityLogId} AND ${notificationReads.userId} = ${userId}`
      )
      .where(sql`${notificationReads.id} IS NULL`);
    
    return result.map(row => row.activity_logs);
  }
  

  // Analytics operations
  async getTotalBudgetVsSpent(): Promise<ProjectBudgetComparison[]> {
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

  async getMonthlySpendingTrends(): Promise<MonthlySpending[]> {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    const rows = await db
      .select({
        month: sql<string>`to_char(${expenses.createdAt}, 'Mon')`.as('month'),
        category: expenses.category,
        total: sql<number>`SUM(${expenses.amount})`.as('total'),
      })
      .from(expenses)
      .groupBy(
        sql`to_char(${expenses.createdAt}, 'Mon')`,
        expenses.category
      )
      .orderBy(sql`MIN(${expenses.createdAt})`);

    const trendsMap = new Map<string, MonthlySpending>();

    for (const row of rows) {
      const month = row.month;
      const category = row.category as 'equipment' | 'labor' | 'transport';

      if (!trendsMap.has(month)) {
        trendsMap.set(month, {
          month,
          equipment: 0,
          labor: 0,
          transport: 0,
        });
      }

      trendsMap.get(month)![category] = Number(row.total);
    }

    return Array.from(trendsMap.values());
  }

  async getSpendingByCategory(): Promise<SpendingCategory[]> {
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

  async getExpenseApprovalRates(): Promise<ExpenseApprovalRate[]> {
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

  async getSpendingByEmployee(): Promise<EmployeeSpending[]> {
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
  
    const finalResult: EmployeeSpending[] = [];
  
    for (const row of result) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.userId));
  
      if (user) {
        finalResult.push({
          employeeId: user.id,
          employeeName: user.name,
          amount: row.amount,
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
