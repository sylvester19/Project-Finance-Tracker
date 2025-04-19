import { pgTable, text, serial, integer, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferInsertModel } from "drizzle-orm";

import { z } from "zod";

// Enum values for roles
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  SALESPERSON: "salesperson",
  EMPLOYEE: "employee",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Enum values for project status
export const ProjectStatus = {
  IN_PROGRESS: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];


// Session Token model
export const sessionToken = pgTable("session_token", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  refreshToken: text("refresh_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<UserRoleType>().notNull(),
});

// Client model
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  createdById: integer("created_by_id").notNull().references(() => users.id),
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  status: text("status").$type<ProjectStatusType>().notNull().default(ProjectStatus.IN_PROGRESS),
  startDate: timestamp("start_date").notNull(),
  budget: doublePrecision("budget").notNull(),
  createdById: integer("created_by_id").notNull(),
});

export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  projectRole: text("project_role").$type<UserRoleType>(),
});

// Expense categories
export const ExpenseCategory = {
  EQUIPMENT: "equipment",
  LABOR: "labor",
  TRANSPORT: "transport",
  MAINTENANCE: "maintenance",
  UTILITIES: "utilities",
  PERMITS: "permits",
  OTHER: "other",
} as const;

// Enum values for expense status
export const ExpenseStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ExpenseCategoryType = typeof ExpenseCategory[keyof typeof ExpenseCategory];
export type ExpenseStatusType = typeof ExpenseStatus[keyof typeof ExpenseStatus];

// Expense model
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),  // Linked to projects table
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<ExpenseCategoryType>().notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").$type<ExpenseStatusType>().notNull().default(ExpenseStatus.PENDING),
  submittedById: integer("submitted_by_id").notNull().references(() => users.id),  // Linked to users table
  reviewedById: integer("reviewed_by_id").references(() => users.id),  // Linked to users table (nullable)
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export enum ActivityAction {
  // Expense-related
  EXPENSE_SUBMITTED = "expense_submitted",
  EXPENSE_UPDATED = "expense_updated",
  EXPENSE_APPROVED = "expense_approved",
  EXPENSE_REJECTED = "expense_rejected",

  // Project-user related
  USER_ASSIGNED = "user_assigned",
  USER_REMOVED = "user_removed",

  // Project status-related
  PROJECT_CREATED = "project_created",
  PROJECT_UPDATED = "project_updated",
}

export type InternalUser  = typeof users.$inferSelect;
export type User = Omit<InternalUser , 'password'>;
export type Expense = typeof expenses.$inferSelect;
export type Project = typeof projects.$inferSelect;

export type ExpenseLogDetails = Expense;
export type UserLogDetails = User;
export type ProjectLogDetails = Project;

export type ActivityLogDetails = ExpenseLogDetails | UserLogDetails | ProjectLogDetails;

// Activity Log model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").$type<ActivityAction>().notNull(),
  details: json("details").$type<ActivityLogDetails>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  projectId: integer("project_id").references(() => projects.id),
});

export const activityLogTargets = pgTable("activity_log_targets", {
  id: serial("id").primaryKey(),  
  activityLogId: integer("activity_log_id").notNull().references(() => activityLogs.id),
  targetUserId: integer("target_user_id").notNull().references(() => users.id),
});

export const notificationReads = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  activityLogId: integer("activity_log_id").notNull().references(() => activityLogs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

// insert schemas
export const insertSessionTokenSchema = createInsertSchema(sessionToken).pick({
  userId: true,
  refreshToken: true,
  expiresAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  contactPerson: true,
  contactEmail: true,
  contactPhone: true,
  createdById: true
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  clientId: true,
  status: true,
  startDate: true,
  budget: true,
  createdById: true,
});

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).pick({
  userId: true,
  projectId: true,
  assignedBy: true,
  projectRole: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  projectId: true,
  amount: true,
  description: true,
  category: true,
  receiptUrl: true,
  status: true,
  submittedById: true,
  reviewedById: true,
  feedback: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  projectId: true,
  action: true,
  details: true,
});

export const insertActivityLogTargetSchema = createInsertSchema(activityLogTargets).pick({
  activityLogId: true,
  targetUserId: true,
});

export const insertNotificationReadSchema = createInsertSchema(notificationReads).pick({
  activityLogId: true,
  userId: true,
});


// Extended schemas with validation
export const userLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const projectFormSchema = insertProjectSchema.extend({
  budget: z.number().min(1, "Budget must be greater than 0"),
});

export const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(3, "Description must be at least 3 characters"),
});


// Types for database operations
export type InsertSessionToken = z.infer<typeof insertSessionTokenSchema>;
export type SessionToken = typeof sessionToken.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;

export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type InsertActivityLog = InferInsertModel<typeof activityLogs>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertActivityLogTarget = z.infer<typeof insertActivityLogTargetSchema>;
export type ActivityLogTarget = typeof activityLogTargets.$inferSelect;

export type InsertNotificationRead = z.infer<typeof insertNotificationReadSchema>;
export type NotificationRead = typeof notificationReads.$inferSelect;

export type LoginCredentials = z.infer<typeof userLoginSchema>;

// Custom type 

export type ProjectBudgetComparison = {
  project: string;
  budget: number;
  spent: number;
};

export type MonthlySpending = {
  month: string;
  equipment: number;
  labor: number;
  transport: number;
};

export type SpendingCategory = {
  category: ExpenseCategoryType;
  amount: number;
};

export type ExpenseApprovalRate = {
  status: 'Pending' | 'Approved' | 'Rejected';
  count: number;
};

export type EmployeeSpending = {
  employeeId: number;
  employeeName: string;
  amount: number;
};
